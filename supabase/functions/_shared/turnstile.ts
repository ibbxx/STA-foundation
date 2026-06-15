// @ts-nocheck
export async function verifyTurnstile(token: string, remoteIp?: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) {
    throw new Error('TURNSTILE_SECRET_KEY belum dikonfigurasi.');
  }
  if (!token) return false;

  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp && remoteIp !== 'unknown') form.set('remoteip', remoteIp);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    throw new Error('Server verifikasi Turnstile tidak dapat dihubungi.');
  }

  const result = await response.json();
  return result.success === true;
}
