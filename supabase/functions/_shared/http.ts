// @ts-nocheck
const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.sekolahtanahair.org',
  'https://sekolahtanahair.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function parseOrigins(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAllowedOrigins() {
  const configuredOrigins = parseOrigins(Deno.env.get('ALLOWED_ORIGINS'));
  if (configuredOrigins.length > 0) return configuredOrigins;

  const legacyOrigin = parseOrigins(Deno.env.get('ALLOWED_ORIGIN'));
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...legacyOrigin])];
}

export function corsHeaders(request?: Request) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };

  const origin = request?.headers.get('Origin')?.trim();
  if (!origin) return headers;

  if (getAllowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    console.error('[cors] Rejected request origin:', origin);
  }

  return headers;
}

export function jsonResponse(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
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
