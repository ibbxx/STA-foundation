// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, corsHeaders, safeFileName, validateImage } from '../_shared/http.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';

const PAYMENT_SETTINGS_KEY = 'payment_settings';
const DEFAULT_QRIS_IMAGE_URL = '/images/qris-payment.jpeg';
const MANUAL_PAYMENT_METHODS = ['qris', 'bank_transfer'];

function normalizePaymentSettings(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { manual_enabled: true, gateway_enabled: false, qris_image_url: DEFAULT_QRIS_IMAGE_URL, bank_accounts: [] };
  }
  const qrisImageUrl = typeof value.qris_image_url === 'string' ? value.qris_image_url.trim() : '';

  return {
    manual_enabled: typeof value.manual_enabled === 'boolean' ? value.manual_enabled : true,
    gateway_enabled: typeof value.gateway_enabled === 'boolean' ? value.gateway_enabled : false,
    qris_image_url: qrisImageUrl || DEFAULT_QRIS_IMAGE_URL,
    bank_accounts: Array.isArray(value.bank_accounts) ? value.bank_accounts : [],
  };
}

function hasManualPaymentDetails(settings: ReturnType<typeof normalizePaymentSettings>, method: string) {
  if (method === 'qris') return Boolean(settings.qris_image_url);
  if (method === 'bank_transfer') {
    return settings.bank_accounts.some((account) => (
      account
      && typeof account === 'object'
      && typeof account.bank_name === 'string'
      && account.bank_name.trim()
      && typeof account.account_number === 'string'
      && account.account_number.trim()
      && typeof account.account_name === 'string'
      && account.account_name.trim()
    ));
  }
  return false;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, request);
  }

  const uploadedPaths: string[] = [];
  let insertedDonationId: string | null = null;

  try {
    const contentType = request.headers.get('content-type') ?? '';
    let payload: any;
    let paymentProof: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      payload = JSON.parse(String(form.get('payload') ?? '{}'));
      const maybeProof = form.get('payment_proof');
      paymentProof = maybeProof instanceof File && maybeProof.size > 0 ? maybeProof : null;
    } else {
      payload = await request.json();
    }

    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const token = String(payload.turnstile_token ?? '');

    const isHuman = await verifyTurnstile(token, remoteIp);
    if (!isHuman) {
      return jsonResponse({ error: 'Verifikasi keamanan gagal atau kedaluwarsa.' }, 403, request);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: settingsRow, error: settingsError } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', PAYMENT_SETTINGS_KEY)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const paymentSettings = normalizePaymentSettings(settingsRow?.value);
    const paymentMethod = String(payload.payment_method ?? '').trim();
    const isManualPayment = MANUAL_PAYMENT_METHODS.includes(paymentMethod);

    if (isManualPayment && !paymentSettings.manual_enabled) {
      return jsonResponse({ error: 'Metode donasi manual sedang tidak tersedia.' }, 400, request);
    }

    if (isManualPayment && !hasManualPaymentDetails(paymentSettings, paymentMethod)) {
      return jsonResponse({ error: 'Metode donasi manual belum dikonfigurasi.' }, 400, request);
    }

    if (!isManualPayment && !paymentSettings.gateway_enabled) {
      return jsonResponse({ error: 'Metode pembayaran belum tersedia.' }, 400, request);
    }

    let paymentProofPath: string | null = null;
    if (isManualPayment) {
      if (!paymentProof) {
        return jsonResponse({ error: 'Bukti pembayaran wajib diunggah.' }, 400, request);
      }

      validateImage(paymentProof);
      const proofPath = `manual/${Date.now()}_${crypto.randomUUID()}_${safeFileName(paymentProof.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('donation-proofs')
        .upload(proofPath, paymentProof, {
          contentType: paymentProof.type,
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) throw uploadError;
      uploadedPaths.push(proofPath);
      paymentProofPath = proofPath;
    }

    const { data: id, error } = await supabase.rpc('create_pending_donation', {
      p_campaign_id: payload.campaign_id,
      p_donor_name: payload.donor_name,
      p_donor_email: payload.donor_email,
      p_donor_phone: payload.donor_phone,
      p_amount: payload.amount,
      p_payment_method: paymentMethod,
      p_message: payload.message,
      p_is_anonymous: payload.is_anonymous,
    });

    if (error) throw error;
    insertedDonationId = id;

    if (paymentProofPath) {
      const { error: proofUpdateError } = await supabase
        .from('donations')
        .update({ payment_proof_path: paymentProofPath })
        .eq('id', id);
      if (proofUpdateError) throw proofUpdateError;
    }

    return jsonResponse({ id }, 201, request);
  } catch (error) {
    if (insertedDonationId) {
      const cleanupClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await cleanupClient.from('donations').delete().eq('id', insertedDonationId);
    }

    if (uploadedPaths.length > 0) {
      const cleanupClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await cleanupClient.storage.from('donation-proofs').remove(uploadedPaths);
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Donasi gagal dibuat.' },
      400,
      request,
    );
  }
});
