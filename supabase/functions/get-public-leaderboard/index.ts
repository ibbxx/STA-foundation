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
    const payload = await request.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(payload.limit ?? 100), 1), 100);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase
      .from('leaderboard')
      .select('identifier, display_name, total_amount, donation_count')
      .order('total_amount', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return jsonResponse({ entries: data ?? [] });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Gagal memuat leaderboard.' },
      400,
    );
  }
});
