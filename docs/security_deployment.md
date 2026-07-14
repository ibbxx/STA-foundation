# Security Deployment

Gunakan urutan ini agar database, Edge Functions, dan frontend tetap sinkron.

1. Jalankan schema kanonik:

   Jalankan isi file `supabase/migrations/20260616000000_consolidated_schema.sql`
   di Supabase SQL Editor atau lewat alur migration yang biasa kamu pakai.

2. Set secret untuk Edge Functions publik:

   ```bash
   supabase secrets set \
     TURNSTILE_SECRET_KEY=your-secret \
     ALLOWED_ORIGINS=https://www.sekolahtanahair.org,https://sekolahtanahair.org,http://localhost:3000,http://127.0.0.1:3000
   ```

3. Deploy Edge Functions publik:

   ```bash
   supabase functions deploy create-pending-donation
   supabase functions deploy get-public-campaign-donations
   supabase functions deploy get-public-leaderboard
   supabase functions deploy submit-school-report
   supabase functions deploy submit-volunteer-registration
   ```

4. Aktifkan leaked password protection di Supabase Auth.
   Setting ini tidak dikontrol oleh migration SQL repo ini. Nyalakan di Dashboard Auth atau konfigurasi environment Supabase yang kamu pakai.

5. Deploy frontend setelah database dan functions selesai.

Catatan:
- Repo ini sekarang hanya menyimpan satu file schema SQL kanonik di `supabase/migrations`.
- Admin access tetap bergantung pada tabel `public.admin_users`.
- Otomasi pembayaran Xendit belum aktif di repo ini. Status donasi saat ini dikonfirmasi dari admin panel atau lewat webhook terpisah jika nanti ditambahkan.
