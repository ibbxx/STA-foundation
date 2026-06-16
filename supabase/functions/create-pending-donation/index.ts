// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse, corsHeaders } from '../_shared/http.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const payload = await request.json();
    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const token = String(payload.turnstile_token ?? '');

    const isHuman = await verifyTurnstile(token, remoteIp);
    if (!isHuman) {
      return jsonResponse({ error: 'Verifikasi keamanan gagal atau kedaluwarsa.' }, 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: id, error } = await supabase.rpc('create_pending_donation', {
      p_campaign_id: payload.campaign_id,
      p_donor_name: payload.donor_name,
      p_donor_email: payload.donor_email,
      p_donor_phone: payload.donor_phone,
      p_amount: payload.amount,
      p_payment_method: payload.payment_method,
      p_message: payload.message,
      p_is_anonymous: payload.is_anonymous,
    });

    if (error) throw error;

    return jsonResponse({ id }, 201);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Donasi gagal dibuat.' },
      400,
    );
  }
});
