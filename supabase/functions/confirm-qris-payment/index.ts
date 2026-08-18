// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, corsHeaders, safeFileName, validateImage } from '../_shared/http.ts';

/**
 * Edge Function: confirm-qris-payment
 *
 * Menerima bukti pembayaran QRIS dari donatur publik (tanpa login),
 * lalu mengunggah file ke storage bucket `donation-proofs` menggunakan
 * service_role key (bypass RLS) dan memperbarui kolom payment_proof_path
 * pada tabel donations.
 *
 * Body: multipart/form-data
 *   - donation_id: string (UUID donasi yang akan dikonfirmasi)
 *   - payment_proof: File (gambar bukti pembayaran)
 */

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, request);
  }

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse({ error: 'Content-Type harus multipart/form-data.' }, 400, request);
    }

    const form = await request.formData();
    const donationId = String(form.get('donation_id') ?? '').trim();
    const maybeProof = form.get('payment_proof');
    const paymentProof = maybeProof instanceof File && maybeProof.size > 0 ? maybeProof : null;

    if (!donationId) {
      return jsonResponse({ error: 'donation_id wajib diisi.' }, 400, request);
    }

    if (!paymentProof) {
      return jsonResponse({ error: 'Bukti pembayaran wajib diunggah.' }, 400, request);
    }

    // Validasi tipe dan ukuran file
    validateImage(paymentProof);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Pastikan donasi ada dan statusnya masih pending
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('id, payment_status')
      .eq('id', donationId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!donation) {
      return jsonResponse({ error: 'Donasi tidak ditemukan.' }, 404, request);
    }

    if (donation.payment_status !== 'pending') {
      return jsonResponse({ error: 'Donasi ini sudah diproses sebelumnya.' }, 400, request);
    }

    // Upload file ke storage
    const proofPath = `qris/${donationId}/${Date.now()}_${safeFileName(paymentProof.name)}`;
    const { error: uploadError } = await supabase.storage
      .from('donation-proofs')
      .upload(proofPath, paymentProof, {
        contentType: paymentProof.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[confirm-qris-payment] Upload error:', uploadError);
      throw new Error('Gagal mengunggah bukti pembayaran.');
    }

    // Update payment_proof_path pada donation
    const { error: updateError } = await supabase
      .from('donations')
      .update({ payment_proof_path: proofPath })
      .eq('id', donationId);

    if (updateError) {
      // Rollback: hapus file yang sudah diupload
      await supabase.storage.from('donation-proofs').remove([proofPath]);
      console.error('[confirm-qris-payment] Update error:', updateError);
      throw new Error('Gagal menyimpan data bukti pembayaran.');
    }

    return jsonResponse({ success: true, proof_path: proofPath }, 200, request);
  } catch (error) {
    console.error('[confirm-qris-payment]', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Gagal memproses konfirmasi pembayaran.' },
      400,
      request,
    );
  }
});
