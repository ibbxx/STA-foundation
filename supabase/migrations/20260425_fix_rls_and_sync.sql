-- ============================================================
-- FIX: RLS Policies untuk tabel campaigns dan donations
-- ============================================================
-- Masalah: Tabel campaigns dan donations tidak memiliki
-- kebijakan RLS yang memungkinkan publik membaca data
-- atau admin untuk mengelola data.
-- ============================================================

-- 1. CAMPAIGNS: Aktifkan RLS dan tambahkan policies
alter table public.campaigns enable row level security;

-- Publik bisa melihat semua campaign
drop policy if exists "campaigns_public_select" on public.campaigns;
create policy "campaigns_public_select"
on public.campaigns
for select
using (true);

-- Admin bisa melakukan semua operasi pada campaigns
drop policy if exists "campaigns_authenticated_all" on public.campaigns;
create policy "campaigns_authenticated_all"
on public.campaigns
for all
to authenticated
using (true)
with check (true);

-- 2. DONATIONS: Aktifkan RLS dan tambahkan policies
alter table public.donations enable row level security;

-- Publik bisa melihat donasi (diperlukan untuk view public_campaign_donations)
drop policy if exists "donations_public_select" on public.donations;
create policy "donations_public_select"
on public.donations
for select
using (true);

-- Publik bisa membuat donasi baru (untuk form donasi)
drop policy if exists "donations_anon_insert" on public.donations;
create policy "donations_anon_insert"
on public.donations
for insert
to anon
with check (true);

-- Authenticated users bisa insert donasi
drop policy if exists "donations_authenticated_insert" on public.donations;
create policy "donations_authenticated_insert"
on public.donations
for insert
to authenticated
with check (true);

-- Admin bisa update dan delete donasi
drop policy if exists "donations_authenticated_update" on public.donations;
create policy "donations_authenticated_update"
on public.donations
for update
to authenticated
using (true)
with check (true);

drop policy if exists "donations_authenticated_delete" on public.donations;
create policy "donations_authenticated_delete"
on public.donations
for delete
to authenticated
using (true);

-- 3. PROGRAMS: Aktifkan RLS dan tambahkan policies
alter table public.programs enable row level security;

-- Publik bisa melihat semua program
drop policy if exists "programs_public_select" on public.programs;
create policy "programs_public_select"
on public.programs
for select
using (true);

-- Admin bisa mengelola program
drop policy if exists "programs_authenticated_all" on public.programs;
create policy "programs_authenticated_all"
on public.programs
for all
to authenticated
using (true)
with check (true);

-- 4. SCHOOL_REPORTS: Aktifkan RLS dan tambahkan policies
alter table public.school_reports enable row level security;

-- Publik bisa insert laporan baru
drop policy if exists "school_reports_anon_insert" on public.school_reports;
create policy "school_reports_anon_insert"
on public.school_reports
for insert
to anon
with check (true);

-- Admin bisa mengelola semua laporan
drop policy if exists "school_reports_authenticated_all" on public.school_reports;
create policy "school_reports_authenticated_all"
on public.school_reports
for all
to authenticated
using (true)
with check (true);

-- Publik bisa melihat laporan yang sudah verified/actioned
drop policy if exists "school_reports_public_select" on public.school_reports;
create policy "school_reports_public_select"
on public.school_reports
for select
using (status in ('verified', 'actioned'));

-- 5. SITE_CONTENT: Aktifkan RLS dan tambahkan policies
alter table public.site_content enable row level security;

-- Publik bisa melihat semua site content (diperlukan untuk hero section dll)
drop policy if exists "site_content_public_select" on public.site_content;
create policy "site_content_public_select"
on public.site_content
for select
using (true);

-- Admin bisa mengelola site content
drop policy if exists "site_content_authenticated_all" on public.site_content;
create policy "site_content_authenticated_all"
on public.site_content
for all
to authenticated
using (true)
with check (true);

-- ============================================================
-- 6. TRIGGER: Auto-sync kolom category (text) saat category_id diupdate
-- ============================================================
-- Ketika admin memilih kategori via dropdown (category_id), kolom
-- legacy "category" (text) juga harus ikut terupdate agar halaman
-- publik yang masih membaca kolom ini tetap menampilkan data.
-- ============================================================

create or replace function public.sync_campaign_category_name()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null then
    select name into new.category
    from public.categories
    where id = new.category_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_campaign_category_name on public.campaigns;
create trigger trg_sync_campaign_category_name
before insert or update on public.campaigns
for each row
execute function public.sync_campaign_category_name();

-- Backfill: Sinkronkan category text untuk data yang sudah ada
update public.campaigns campaign
set category = categories.name
from public.categories categories
where campaign.category_id = categories.id
  and (campaign.category is null or campaign.category <> categories.name);

-- ============================================================
-- 7. GRANT: Pastikan akses tabel untuk role anon & authenticated
-- ============================================================

grant select on public.campaigns to anon;
grant select, insert on public.donations to anon;
grant select on public.programs to anon;
grant insert on public.school_reports to anon;
grant select on public.site_content to anon;

grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.donations to authenticated;
grant select, insert, update, delete on public.programs to authenticated;
grant select, insert, update, delete on public.school_reports to authenticated;
grant select, insert, update, delete on public.site_content to authenticated;
