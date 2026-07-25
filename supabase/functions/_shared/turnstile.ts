// @ts-nocheck
export async function verifyTurnstile(token: string, remoteIp?: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');

  // Jika TURNSTILE_SECRET_KEY belum di-set di Supabase Secrets, lewati verifikasi agar tidak error di local/dev
  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY belum di-set di Supabase Secrets. Melewati verifikasi.');
    return true;
  }

  // Token dummy Cloudflare (testing key: 1x00000000000000000000AA)
  if (token === 'XXXX.DUMMY.TOKEN.XXXX' || token.startsWith('1x0000000')) {
    return true;
  }

  if (!token) {
    console.warn('[turnstile] Token Turnstile kosong.');
    return false;
  }

  try {
    const form = new FormData();
    form.set('secret', secret);
    form.set('response', token);
    if (remoteIp && remoteIp !== 'unknown') form.set('remoteip', remoteIp);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      console.error('[turnstile] Server Cloudflare siteverify HTTP error:', response.status);
      return false;
    }

    const result = await response.json();
    if (result.success === true) {
      return true;
    }

    console.warn('[turnstile] Verifikasi Turnstile gagal. Result:', JSON.stringify(result));
    return false;
  } catch (err) {
    console.error('[turnstile] Gagal menghubungkan ke Cloudflare Turnstile:', err);
    return false;
  }
}
