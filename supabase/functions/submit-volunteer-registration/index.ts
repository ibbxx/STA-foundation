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

    console.log('[submit-volunteer-registration] Received payload keys:', Object.keys(payload));
    console.log('[submit-volunteer-registration] program_id:', payload.program_id);
    console.log('[submit-volunteer-registration] nama_lengkap:', payload.nama_lengkap ? '✓' : '✗ MISSING');
    console.log('[submit-volunteer-registration] email:', payload.email ? '✓' : '✗ MISSING');
    console.log('[submit-volunteer-registration] whatsapp:', payload.whatsapp ? '✓' : '✗ MISSING');

    const isHuman = await verifyTurnstile(token);
    if (!isHuman) {
      return jsonResponse({ error: 'Verifikasi keamanan gagal atau kedaluwarsa.' }, 403);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify program is open
    const { data: program, error: programError } = await supabase
      .from('volunteer_programs')
      .select('status, registration_start, registration_end')
      .eq('id', payload.program_id)
      .single();

    console.log('[submit-volunteer-registration] Program query result:', { program, programError: programError?.message });

    if (programError) {
      console.error('Database query error during program verification:', programError);
      return jsonResponse({ error: `Gagal memverifikasi status program: ${programError.message}` }, 400);
    }

    const now = new Date();
    const isOpen = program.registration_start && program.registration_end
      ? (now >= new Date(program.registration_start) && now <= new Date(program.registration_end))
      : (program?.status === 'open');

    if (!isOpen) {
      console.log('[submit-volunteer-registration] Program registration is closed.');
      return jsonResponse({ error: 'Pendaftaran program sedang ditutup.' }, 400);
    }

    const uploadPrivateFile = async (prefix: string, file: File) => {
      const path = `${prefix}/${Date.now()}_${crypto.randomUUID()}_${safeFileName(file.name)}`;
      const { error } = await supabase.storage
        .from('volunteer-assets')
        .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (error) throw error;
      uploadedPaths.push(path);
      return path;
    };

    // Dynamically process and upload files in form
    const uploadedFiles: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (value instanceof File) {
        const isPdf = value.type === 'application/pdf' || value.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          if (value.size <= 0 || value.size > 10 * 1024 * 1024) {
            throw new Error('Ukuran file PDF maksimal 10MB.');
          }
        } else {
          validateImage(value);
        }
        const path = await uploadPrivateFile(key, value);
        uploadedFiles[key] = path;
      }
    }

    const answers = {
      ...(payload.answers || {}),
      ...uploadedFiles,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('volunteer_registrations')
      .insert({
        program_id: payload.program_id,
        nama_lengkap: payload.nama_lengkap,
        email: payload.email,
        whatsapp: payload.whatsapp,
        whatsapp_emergency: answers['whatsapp_emergency'] || null,
        alamat: answers['alamat'] || null,
        tanggal_lahir: answers['tanggal_lahir'] || null,
        size_baju: answers['size_baju'] || null,
        pendidikan: answers['pendidikan'] || null,
        bidang_diminati: answers['bidang_diminati'] || null,
        riwayat_penyakit: answers['riwayat_penyakit'] || null,
        bukti_dp_url: uploadedFiles['bukti_dp'] || null,
        bukti_follow_url: uploadedFiles['bukti_follow_ig'] || null,
        foto_id_url: uploadedFiles['foto_id_card'] || null,
        answers: answers,
        registration_type: payload.registration_type || 'reguler',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return jsonResponse({ id: inserted.id }, 201);
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const cleanupClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await cleanupClient.storage.from('volunteer-assets').remove(uploadedPaths);
    }
    console.error('Unexpected function error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error && typeof error === 'object' && 'message' in error) 
        ? String((error as any).message) 
        : 'Pendaftaran gagal dikirim.';
    return jsonResponse({ error: errorMessage }, 400);
  }
});
