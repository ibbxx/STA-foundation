// @ts-nocheck
function resolveAllowedOrigin() {
  const configuredOrigin = Deno.env.get('ALLOWED_ORIGIN')?.trim();
  if (configuredOrigin) return configuredOrigin;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const isLocal =
    Deno.env.get('SUPABASE_FUNCTIONS_LOCAL') === 'true'
    || supabaseUrl.includes('localhost')
    || supabaseUrl.includes('127.0.0.1');

  if (isLocal) return '*';

  throw new Error('ALLOWED_ORIGIN wajib diset untuk Edge Function production.');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': resolveAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180);
}

export function validateImage(file: File) {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedTypes.has(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WebP.');
  }
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran setiap gambar maksimal 5MB.');
  }
}
