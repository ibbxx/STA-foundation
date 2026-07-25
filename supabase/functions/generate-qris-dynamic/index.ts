// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, corsHeaders } from '../_shared/http.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';
import { parseQrisTlv, buildDynamicQris, validateQrisRawString } from '../_shared/qris-parser.ts';

const PAYMENT_SETTINGS_KEY = 'payment_settings';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, request);
  }

  try {
    const payload = await request.json();

    // 1. Verify Turnstile
    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const isHuman = await verifyTurnstile(String(payload.turnstile_token ?? ''), remoteIp);
    if (!isHuman) {
      return jsonResponse({ error: 'Verifikasi keamanan gagal.' }, 403, request);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 2. Ambil payment settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', PAYMENT_SETTINGS_KEY)
      .maybeSingle();

    if (settingsError) throw settingsError;

    const settings = settingsRow?.value;
    if (!settings?.manual_enabled) {
      return jsonResponse({ error: 'Metode QRIS tidak tersedia.' }, 400, request);
    }

    const qrisRawString = settings.qris_raw_string;
    if (!qrisRawString || typeof qrisRawString !== 'string' || !qrisRawString.trim()) {
      return jsonResponse({ error: 'QRIS belum dikonfigurasi. Hubungi admin.' }, 400, request);
    }

    // Validasi format QRIS raw string
    const qrisValidation = validateQrisRawString(qrisRawString.trim());
    if (!qrisValidation.valid) {
      return jsonResponse({ error: `QRIS tidak valid: ${qrisValidation.error}` }, 400, request);
    }

    // 3. Validasi input
    const amount = Number(payload.amount);
    if (!amount || amount < 10000 || amount > 1000000000 || !Number.isInteger(amount)) {
      return jsonResponse({ error: 'Nominal donasi tidak valid.' }, 400, request);
    }

    const campaignId = String(payload.campaign_id ?? '').trim();
    const donorName = String(payload.donor_name ?? '').trim();
    const donorEmail = String(payload.donor_email ?? '').trim();
    const donorPhone = String(payload.donor_phone ?? '').trim();
    const message = String(payload.message ?? '').trim();
    const isAnonymous = Boolean(payload.is_anonymous);

    if (!campaignId) {
      return jsonResponse({ error: 'Campaign ID wajib diisi.' }, 400, request);
    }
    if (donorName.length < 2 || donorName.length > 120) {
      return jsonResponse({ error: 'Nama donatur tidak valid.' }, 400, request);
    }
    if (donorEmail.length < 3 || donorEmail.length > 254) {
      return jsonResponse({ error: 'Email donatur tidak valid.' }, 400, request);
    }
    if (donorPhone.length < 8 || donorPhone.length > 30) {
      return jsonResponse({ error: 'Nomor telepon donatur tidak valid.' }, 400, request);
    }

    // 4. Set nominal pas tanpa digit tambahan
    const uniqueCode = 0;
    const finalAmount = amount;

    // 5. Parse dan build QRIS dinamis dengan nominal pas
    const tags = parseQrisTlv(qrisRawString.trim());
    const dynamicQris = buildDynamicQris(tags, finalAmount);

    // 6. Simpan donasi ke database
    const { data: donationResult, error: donationError } = await supabase
      .rpc('create_pending_donation_dynamic', {
        p_campaign_id: campaignId,
        p_donor_name: donorName,
        p_donor_email: donorEmail,
        p_donor_phone: donorPhone,
        p_amount: amount,
        p_payment_method: 'qris',
        p_message: message,
        p_is_anonymous: isAnonymous,
        p_unique_code: uniqueCode,
        p_expiry_minutes: 30,
      });
    if (donationError) throw donationError;

    const row = donationResult[0];

    return jsonResponse({
      donation_id: row.donation_id,
      qris_string: dynamicQris,
      final_amount: row.final_amount,
      unique_code: row.unique_code,
      expires_at: row.expires_at,
    }, 201, request);

  } catch (error) {
    console.error('[generate-qris-dynamic]', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Gagal membuat QRIS dinamis.' },
      400,
      request,
    );
  }
});
