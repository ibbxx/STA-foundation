# Security Deployment

Gunakan urutan ini agar database, Edge Functions, dan frontend tetap sinkron.

1. Untuk database existing yang sudah memiliki data:

   Jalankan isi file `supabase/migrations/20260616_professional_schema_alignment.sql`
   di Supabase SQL Editor atau lewat alur migration yang biasa kamu pakai.

2. Untuk environment baru / kosong:

   Jalankan isi file `supabase/migrations/20260615_full_database_setup.sql`
   di Supabase SQL Editor atau lewat alur migration bootstrap environment baru.

3. Set secret untuk Edge Functions publik:

   ```bash
   supabase secrets set TURNSTILE_SECRET_KEY=your-secret ALLOWED_ORIGIN=https://your-domain.example
   ```

4. Deploy Edge Functions publik:

   ```bash
   supabase functions deploy submit-school-report
   supabase functions deploy submit-volunteer-registration
   ```

5. Deploy frontend setelah database dan functions selesai.

Catatan:
- `supabase_schema_reference.sql` hanya referensi schema live, bukan migration.
- Admin access tetap bergantung pada tabel `public.admin_users`.
- Otomasi pembayaran Xendit belum aktif di repo ini. Status donasi saat ini dikonfirmasi dari admin panel atau lewat webhook terpisah jika nanti ditambahkan.
