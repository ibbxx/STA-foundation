// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const payload = await request.json();
    const campaignId = String(payload.campaign_id ?? '');
    const limit = Math.min(Math.max(Number(payload.limit ?? 10), 1), 50);

    if (!campaignId) {
      return jsonResponse({ error: 'campaign_id wajib diisi.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase
      .from('public_campaign_donations')
      .select('id, campaign_id, donor_name_display, amount, message, created_at, is_anonymous')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return jsonResponse({ donations: data ?? [] });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Gagal memuat donasi publik.' },
      400,
    );
  }
});
