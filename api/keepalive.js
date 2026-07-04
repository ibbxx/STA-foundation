/**
 * Vercel Cron Keepalive — mencegah Supabase Free Tier dari pausing database.
 *
 * Dijalankan otomatis setiap 3 hari oleh Vercel Cron (lihat vercel.json).
 * Melakukan query ringan ke tabel `programs` untuk menjaga database tetap aktif.
 *
 * Endpoint: GET /api/keepalive
 * Auth: Dilindungi oleh header CRON_SECRET dari Vercel (otomatis dikirim oleh cron).
 */
export default async function handler(request, response) {
  // Hanya izinkan GET
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Verifikasi bahwa request berasal dari Vercel Cron (opsional tapi disarankan)
  const authHeader = request.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ error: 'Missing Supabase config' });
  }

  try {
    // Query ringan: ambil 1 row dari tabel kecil
    const res = await fetch(
      `${supabaseUrl}/rest/v1/programs?select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      return response.status(502).json({
        error: 'Supabase query failed',
        status: res.status,
        body,
      });
    }

    const data = await res.json();

    // Opsional: refresh materialized view leaderboard
    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/refresh_leaderboard`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
    } catch {
      // Jika refresh gagal, tidak masalah — keepalive tetap sukses
    }

    return response.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      rows: data.length,
    });
  } catch (err) {
    return response.status(500).json({
      error: 'Keepalive failed',
      message: err.message,
    });
  }
}
