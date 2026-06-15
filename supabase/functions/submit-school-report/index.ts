// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, safeFileName, validateImage } from '../_shared/http.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const uploadedPaths: string[] = [];

  try {
    const form = await request.formData();
    const payload = JSON.parse(String(form.get('payload') ?? '{}'));
    const token = String(form.get('turnstile_token') ?? '');
    const photos = form.getAll('photos').filter((value): value is File => value instanceof File);
    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || payload.reporter_ip
      || 'unknown';

    if (photos.length < 1 || photos.length > 3) {
      return jsonResponse({ error: 'Unggah 1 sampai 3 foto sekolah.' }, 400);
    }
    photos.forEach(validateImage);

    const isHuman = await verifyTurnstile(token, remoteIp);
    if (!isHuman) {
      return jsonResponse({ error: 'Verifikasi keamanan gagal atau kedaluwarsa.' }, 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const imageUrls: string[] = [];
    for (const photo of photos) {
      const path = `school-reports/${Date.now()}_${crypto.randomUUID()}_${safeFileName(photo.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('site-media')
        .upload(path, photo, { contentType: photo.type, cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      uploadedPaths.push(path);
      const { data } = supabase.storage.from('site-media').getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }

    const { data: id, error } = await supabase.rpc('submit_school_report', {
      p_reporter_name: payload.reporter_name,
      p_reporter_phone: payload.reporter_phone,
      p_reporter_ip: remoteIp,
      p_school_name: payload.school_name,
      p_location: payload.location,
      p_description: payload.description,
      p_image_urls: imageUrls,
    });
    if (error) throw error;

    return jsonResponse({ id }, 201);
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const cleanupClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await cleanupClient.storage.from('site-media').remove(uploadedPaths);
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Laporan gagal dikirim.' }, 400);
  }
});
