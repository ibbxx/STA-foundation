-- ============================================================
-- Sekolah Tanah Air - Full Supabase SQL Editor Setup
-- ============================================================
-- Cara pakai:
-- 1. Buka Supabase Dashboard > SQL Editor.
-- 2. Paste seluruh isi file ini.
-- 3. Run sekali.
--
-- Script ini dibuat idempotent: aman dijalankan ulang karena memakai
-- create table if not exists, add column if not exists, drop policy if exists,
-- dan on conflict untuk seed/bucket.
-- ============================================================

-- ============================================================
-- 1. Extensions
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 2. Core Tables
-- ============================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon_name text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category_id uuid references public.categories(id) on update cascade on delete set null,
  description text,
  images text[],
  start_date date,
  end_date date,
  is_featured boolean not null default false,
  target_amount numeric(15, 2) not null default 0,
  current_amount numeric(15, 2) not null default 0,
  donor_count integer not null default 0,
  image_url text,
  category text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on update cascade on delete cascade,
  donor_name text not null,
  donor_email text,
  donor_phone text,
  amount numeric(15, 2) not null,
  payment_status text not null default 'pending',
  payment_method text,
  message text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on update cascade on delete cascade,
  title text not null,
  content text not null,
  image_url text,
  update_type text not null default 'General',
  created_at timestamptz not null default now()
);

create table if not exists public.school_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null,
  reporter_phone text not null,
  school_name text not null,
  location text not null,
  description text not null,
  image_urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. Compatibility Fixes For Older STA Schema
-- ============================================================

alter table if exists public.categories
  add column if not exists slug text,
  add column if not exists created_at timestamptz default now();

alter table if exists public.programs
  add column if not exists content text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.campaigns
  add column if not exists category_id uuid references public.categories(id) on update cascade on delete set null,
  add column if not exists description text,
  add column if not exists images text[],
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists is_featured boolean not null default false,
  add column if not exists target_amount numeric(15, 2) not null default 0,
  add column if not exists current_amount numeric(15, 2) not null default 0,
  add column if not exists donor_count integer not null default 0,
  add column if not exists image_url text,
  add column if not exists category text,
  add column if not exists status text not null default 'draft',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'campaign_categories'
  ) then
    execute $migrate_categories$
      insert into public.categories (id, name, slug, created_at)
      select id, name, slug, created_at
      from public.campaign_categories
      on conflict (id) do nothing
    $migrate_categories$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaigns'
      and column_name = 'short_description'
  ) then
    alter table public.campaigns alter column short_description drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaigns'
      and column_name = 'full_description'
  ) then
    alter table public.campaigns alter column full_description drop not null;

    update public.campaigns
    set description = coalesce(description, full_description)
    where description is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaigns'
      and column_name = 'thumbnail_url'
  ) then
    update public.campaigns
    set image_url = coalesce(image_url, thumbnail_url)
    where image_url is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaigns'
      and column_name = 'banner_url'
  ) then
    update public.campaigns
    set image_url = coalesce(image_url, banner_url)
    where image_url is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaigns'
      and column_name = 'deadline'
  ) then
    update public.campaigns
    set end_date = coalesce(end_date, deadline::date)
    where end_date is null
      and deadline is not null;
  end if;
end $$;

alter table if exists public.donations
  add column if not exists donor_name text,
  add column if not exists donor_email text,
  add column if not exists donor_phone text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists payment_method text,
  add column if not exists message text,
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'donations'
      and column_name = 'status'
  ) then
    update public.donations
    set payment_status = case
      when status in ('paid', 'success') then 'success'
      when status in ('failed', 'expired') then 'failed'
      else 'pending'
    end
    where payment_status is null
      or payment_status not in ('pending', 'success', 'failed');
  end if;

  update public.donations
  set donor_name = coalesce(nullif(donor_name, ''), 'Orang Baik')
  where donor_name is null
     or donor_name = '';

  alter table public.donations alter column donor_name set not null;
end $$;

alter table if exists public.campaign_updates
  add column if not exists image_url text,
  add column if not exists images text[],
  add column if not exists update_type text,
  add column if not exists created_at timestamptz not null default now();

update public.campaign_updates
set update_type = 'General'
where update_type is null
  or update_type not in ('General', 'Fundraising Progress', 'Distribution');

alter table if exists public.campaign_updates
  alter column update_type set default 'General',
  alter column update_type set not null;

alter table if exists public.school_reports
  add column if not exists reporter_name text not null default '',
  add column if not exists reporter_phone text not null default '',
  add column if not exists school_name text not null default '',
  add column if not exists location text not null default '',
  add column if not exists description text not null default '',
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.site_content
  add column if not exists key text,
  add column if not exists value jsonb,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'school_reports'
      and column_name = 'reporter_whatsapp'
  ) then
    update public.school_reports
    set reporter_phone = coalesce(nullif(reporter_phone, ''), reporter_whatsapp)
    where reporter_phone = ''
      and reporter_whatsapp is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'school_reports'
      and column_name = 'school_address'
  ) then
    update public.school_reports
    set location = coalesce(nullif(location, ''), school_address)
    where location = ''
      and school_address is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'school_reports'
      and column_name = 'priority_reason'
  ) then
    update public.school_reports
    set description = coalesce(nullif(description, ''), priority_reason)
    where description = ''
      and priority_reason is not null;
  end if;
end $$;

-- ============================================================
-- 4. Constraints
-- ============================================================

alter table if exists public.campaigns
  drop constraint if exists campaigns_category_id_fkey;

alter table if exists public.campaigns
  add constraint campaigns_category_id_fkey
  foreign key (category_id)
  references public.categories(id)
  on update cascade
  on delete set null
  not valid;

alter table if exists public.donations
  drop constraint if exists donations_campaign_id_fkey;

alter table if exists public.donations
  add constraint donations_campaign_id_fkey
  foreign key (campaign_id)
  references public.campaigns(id)
  on update cascade
  on delete cascade
  not valid;

alter table if exists public.campaign_updates
  drop constraint if exists campaign_updates_campaign_id_fkey;

alter table if exists public.campaign_updates
  add constraint campaign_updates_campaign_id_fkey
  foreign key (campaign_id)
  references public.campaigns(id)
  on update cascade
  on delete cascade
  not valid;

alter table if exists public.campaigns
  drop constraint if exists campaigns_status_check;

alter table if exists public.campaigns
  add constraint campaigns_status_check
  check (status in ('draft', 'active', 'completed'));

alter table if exists public.campaigns
  drop constraint if exists campaigns_target_amount_check;

alter table if exists public.campaigns
  add constraint campaigns_target_amount_check
  check (target_amount >= 0);

alter table if exists public.campaigns
  drop constraint if exists campaigns_current_amount_check;

alter table if exists public.campaigns
  add constraint campaigns_current_amount_check
  check (current_amount >= 0);

alter table if exists public.campaigns
  drop constraint if exists campaigns_donor_count_check;

alter table if exists public.campaigns
  add constraint campaigns_donor_count_check
  check (donor_count >= 0);

alter table if exists public.donations
  drop constraint if exists donations_payment_status_check;

alter table if exists public.donations
  add constraint donations_payment_status_check
  check (payment_status in ('pending', 'success', 'failed'));

alter table if exists public.donations
  drop constraint if exists donations_amount_check;

alter table if exists public.donations
  add constraint donations_amount_check
  check (amount > 0);

alter table if exists public.campaign_updates
  drop constraint if exists campaign_updates_update_type_check;

alter table if exists public.campaign_updates
  add constraint campaign_updates_update_type_check
  check (update_type in ('General', 'Fundraising Progress', 'Distribution'));

alter table if exists public.school_reports
  drop constraint if exists school_reports_status_check;

alter table if exists public.school_reports
  add constraint school_reports_status_check
  check (status in ('pending', 'verified', 'actioned'));

-- ============================================================
-- 5. Indexes
-- ============================================================

create index if not exists idx_categories_slug on public.categories(slug);
create unique index if not exists idx_categories_slug_unique on public.categories(slug);
create index if not exists idx_categories_name on public.categories(name, id);

create index if not exists idx_programs_slug on public.programs(slug);
create unique index if not exists idx_programs_slug_unique on public.programs(slug);
create index if not exists idx_programs_updated_at_desc on public.programs(updated_at desc, id);

create index if not exists idx_campaigns_slug on public.campaigns(slug);
create unique index if not exists idx_campaigns_slug_unique on public.campaigns(slug);
create index if not exists idx_campaigns_created_at_desc on public.campaigns(created_at desc, id);
create index if not exists idx_campaigns_status_created_at_desc on public.campaigns(status, created_at desc, id);
create index if not exists idx_campaigns_category_created_at_desc on public.campaigns(category_id, created_at desc, id);
create index if not exists idx_campaigns_public_list on public.campaigns(created_at desc, id)
where status <> 'draft';
create index if not exists idx_campaigns_active_list on public.campaigns(created_at desc, id)
where status = 'active';
create index if not exists idx_campaigns_featured_public_list on public.campaigns(created_at desc, id)
where status <> 'draft' and is_featured = true;

create index if not exists idx_donations_created_at_desc on public.donations(created_at desc, id);
create index if not exists idx_donations_status_created_at_desc on public.donations(payment_status, created_at desc, id);
create index if not exists idx_donations_campaign_created_at_desc on public.donations(campaign_id, created_at desc, id);
create index if not exists idx_donations_success_campaign_created_at_desc on public.donations(campaign_id, created_at desc, id)
where payment_status = 'success';

create index if not exists idx_campaign_updates_campaign_created_at_desc on public.campaign_updates(campaign_id, created_at desc, id);
create index if not exists idx_campaign_updates_type_created_at_desc on public.campaign_updates(update_type, created_at desc, id);

create index if not exists idx_school_reports_updated_at_desc on public.school_reports(updated_at desc, id);
create index if not exists idx_school_reports_status_updated_at_desc on public.school_reports(status, updated_at desc, id);

create index if not exists idx_site_content_key on public.site_content(key);
create unique index if not exists idx_site_content_key_unique on public.site_content(key);
create index if not exists idx_site_content_updated_at_desc on public.site_content(updated_at desc, id);

-- ============================================================
-- 6. Triggers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_programs_set_updated_at on public.programs;
create trigger trg_programs_set_updated_at
before update on public.programs
for each row
execute function public.set_updated_at();

drop trigger if exists trg_campaigns_set_updated_at on public.campaigns;
create trigger trg_campaigns_set_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

drop trigger if exists trg_school_reports_set_updated_at on public.school_reports;
create trigger trg_school_reports_set_updated_at
before update on public.school_reports
for each row
execute function public.set_updated_at();

drop trigger if exists trg_site_content_set_updated_at on public.site_content;
create trigger trg_site_content_set_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();

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

create or replace function public.refresh_campaign_current_amount(target_campaign_id uuid)
returns void
language plpgsql
as $$
begin
  update public.campaigns
  set
    current_amount = coalesce(donation_totals.total_amount, 0),
    donor_count = coalesce(donation_totals.total_count, 0)
  from (
    select
      target_campaign_id as campaign_id,
      sum(amount) filter (where payment_status = 'success') as total_amount,
      count(*) filter (where payment_status = 'success')::integer as total_count
    from public.donations
    where campaign_id = target_campaign_id
  ) donation_totals
  where id = target_campaign_id;
end;
$$;

create or replace function public.apply_campaign_donation_delta(
  target_campaign_id uuid,
  amount_delta numeric,
  count_delta integer
)
returns void
language plpgsql
as $$
begin
  if target_campaign_id is null then
    return;
  end if;

  update public.campaigns
  set
    current_amount = greatest(0, current_amount + amount_delta),
    donor_count = greatest(0, donor_count + count_delta)
  where id = target_campaign_id;
end;
$$;

create or replace function public.sync_campaign_amount_after_donation()
returns trigger
language plpgsql
as $$
declare
  old_amount numeric := 0;
  new_amount numeric := 0;
  old_count integer := 0;
  new_count integer := 0;
begin
  if tg_op = 'DELETE' then
    if old.payment_status = 'success' then
      perform public.apply_campaign_donation_delta(old.campaign_id, -old.amount, -1);
    end if;
    return old;
  end if;

  if new.payment_status = 'success' then
    new_amount := new.amount;
    new_count := 1;
  end if;

  if tg_op = 'INSERT' then
    perform public.apply_campaign_donation_delta(new.campaign_id, new_amount, new_count);
    return new;
  end if;

  if old.payment_status = 'success' then
    old_amount := old.amount;
    old_count := 1;
  end if;

  if old.campaign_id is distinct from new.campaign_id then
    perform public.apply_campaign_donation_delta(old.campaign_id, -old_amount, -old_count);
    perform public.apply_campaign_donation_delta(new.campaign_id, new_amount, new_count);
  else
    perform public.apply_campaign_donation_delta(
      new.campaign_id,
      new_amount - old_amount,
      new_count - old_count
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_campaign_amount_after_donation on public.donations;
create trigger trg_sync_campaign_amount_after_donation
after insert or update or delete on public.donations
for each row
execute function public.sync_campaign_amount_after_donation();

-- ============================================================
-- 7. Public View
-- ============================================================

create or replace view public.public_campaign_donations
with (security_invoker = true) as
select
  id,
  campaign_id,
  case
    when is_anonymous then 'Orang Baik'
    else coalesce(nullif(donor_name, ''), 'Tanpa nama')
  end as donor_name_display,
  amount,
  message,
  created_at,
  is_anonymous
from public.donations
where payment_status = 'success';

create or replace view public.public_campaign_stats
with (security_invoker = true) as
select
  id as campaign_id,
  current_amount,
  donor_count,
  updated_at
from public.campaigns
where status <> 'draft';

-- ============================================================
-- 8. Row Level Security Policies
-- ============================================================

alter table public.categories enable row level security;
alter table public.programs enable row level security;
alter table public.campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.campaign_updates enable row level security;
alter table public.school_reports enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select"
on public.categories
for select
using (true);

drop policy if exists "categories_authenticated_all" on public.categories;
create policy "categories_authenticated_all"
on public.categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists "programs_public_select" on public.programs;
create policy "programs_public_select"
on public.programs
for select
using (true);

drop policy if exists "programs_authenticated_all" on public.programs;
create policy "programs_authenticated_all"
on public.programs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "campaigns_public_select" on public.campaigns;
create policy "campaigns_public_select"
on public.campaigns
for select
using (status <> 'draft');

drop policy if exists "campaigns_authenticated_all" on public.campaigns;
create policy "campaigns_authenticated_all"
on public.campaigns
for all
to authenticated
using (true)
with check (true);

drop policy if exists "donations_public_select" on public.donations;
create policy "donations_public_select"
on public.donations
for select
using (payment_status = 'success');

drop policy if exists "donations_anon_insert" on public.donations;
create policy "donations_anon_insert"
on public.donations
for insert
to anon
with check (true);

drop policy if exists "donations_authenticated_all" on public.donations;
create policy "donations_authenticated_all"
on public.donations
for all
to authenticated
using (true)
with check (true);

drop policy if exists "campaign_updates_public_select" on public.campaign_updates;
create policy "campaign_updates_public_select"
on public.campaign_updates
for select
using (
  exists (
    select 1
    from public.campaigns
    where campaigns.id = campaign_updates.campaign_id
      and campaigns.status <> 'draft'
  )
);

drop policy if exists "campaign_updates_authenticated_all" on public.campaign_updates;
create policy "campaign_updates_authenticated_all"
on public.campaign_updates
for all
to authenticated
using (true)
with check (true);

drop policy if exists "school_reports_anon_insert" on public.school_reports;
create policy "school_reports_anon_insert"
on public.school_reports
for insert
to anon
with check (true);

drop policy if exists "school_reports_public_select" on public.school_reports;
create policy "school_reports_public_select"
on public.school_reports
for select
using (status in ('verified', 'actioned'));

drop policy if exists "school_reports_authenticated_all" on public.school_reports;
create policy "school_reports_authenticated_all"
on public.school_reports
for all
to authenticated
using (true)
with check (true);

drop policy if exists "site_content_public_select" on public.site_content;
create policy "site_content_public_select"
on public.site_content
for select
using (true);

drop policy if exists "site_content_authenticated_all" on public.site_content;
create policy "site_content_authenticated_all"
on public.site_content
for all
to authenticated
using (true)
with check (true);

-- ============================================================
-- 9. Grants
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on public.categories to anon;
grant select on public.programs to anon;
grant select on public.campaigns to anon;
grant select, insert on public.donations to anon;
grant select on public.campaign_updates to anon;
grant insert on public.school_reports to anon;
grant select on public.site_content to anon;
grant select on public.public_campaign_donations to anon;
grant select on public.public_campaign_stats to anon;

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.programs to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.donations to authenticated;
grant select, insert, update, delete on public.campaign_updates to authenticated;
grant select, insert, update, delete on public.school_reports to authenticated;
grant select, insert, update, delete on public.site_content to authenticated;
grant select on public.public_campaign_donations to authenticated;
grant select on public.public_campaign_stats to authenticated;

-- ============================================================
-- 10. Storage Buckets And Policies
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'campaign-assets',
    'campaign-assets',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'site-media',
    'site-media',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campaign_assets_public_select" on storage.objects;
create policy "campaign_assets_public_select"
on storage.objects
for select
using (bucket_id = 'campaign-assets');

drop policy if exists "campaign_assets_authenticated_insert" on storage.objects;
create policy "campaign_assets_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'campaign-assets');

drop policy if exists "campaign_assets_authenticated_update" on storage.objects;
create policy "campaign_assets_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'campaign-assets')
with check (bucket_id = 'campaign-assets');

drop policy if exists "campaign_assets_authenticated_delete" on storage.objects;
create policy "campaign_assets_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'campaign-assets');

drop policy if exists "site_media_public_select" on storage.objects;
create policy "site_media_public_select"
on storage.objects
for select
using (bucket_id = 'site-media');

drop policy if exists "site_media_authenticated_insert" on storage.objects;
create policy "site_media_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-media');

drop policy if exists "site_media_authenticated_update" on storage.objects;
create policy "site_media_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-media')
with check (bucket_id = 'site-media');

drop policy if exists "site_media_authenticated_delete" on storage.objects;
create policy "site_media_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-media');

-- Public school report photo uploads, jika nanti form laporan memakai storage.
drop policy if exists "site_media_school_reports_anon_insert" on storage.objects;
create policy "site_media_school_reports_anon_insert"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'site-media'
  and (storage.foldername(name))[1] = 'school-reports'
);

-- ============================================================
-- 11. Seed Data
-- ============================================================

insert into public.categories (name, slug)
values
  ('Pendidikan', 'pendidikan'),
  ('Kesehatan', 'kesehatan'),
  ('Lingkungan', 'lingkungan'),
  ('Bencana Alam', 'bencana-alam')
on conflict (slug) do update
set name = excluded.name;

insert into public.programs (slug, title, description, icon_name, content)
values
  (
    'temukan-sekolah',
    'Temukan Sekolah',
    'Pemetaan kebutuhan sekolah yang membutuhkan dukungan fasilitas dan pendampingan.',
    'search',
    null
  ),
  (
    'bangun-fasilitas',
    'Bangun Fasilitas',
    'Dukungan pembangunan dan renovasi fasilitas belajar prioritas.',
    'hammer',
    null
  ),
  (
    'dukung-pembelajaran',
    'Dukung Pembelajaran',
    'Dukungan alat belajar, literasi, pelatihan, dan penguatan komunitas sekolah.',
    'graduation-cap',
    null
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  icon_name = excluded.icon_name;

insert into public.site_content (key, value)
values
  ('hero_title', to_jsonb('Sekolah Tanah Air'::text)),
  ('hero_description', to_jsonb('Platform donation-based crowdfunding untuk membantu kebutuhan pendidikan di berbagai daerah Indonesia.'::text)),
  ('hero_primary_label', to_jsonb('Donasi Sekarang'::text)),
  ('hero_primary_link', to_jsonb('/campaigns'::text)),
  ('hero_secondary_label', to_jsonb('Laporkan Sekolah'::text)),
  ('hero_secondary_link', to_jsonb('/laporkan'::text)),
  ('impact_map', to_jsonb('{
    "locations": [
      {
        "id": "journey-bali-01",
        "title": "Awal Jejak di Bali",
        "description": "Tahun 2024 menandai awal perjalanan kami di Bali Utara. Kami berkolaborasi membangun fasilitas sanitasi layak bagi anak-anak di pesisir Buleleng sebagai bagian dari komitmen pemerataan pendidikan.",
        "latitude": -8.179,
        "longitude": 115.152472,
        "status": "Selesai",
        "imageUrl": "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=1200",
        "locationLabel": "Buleleng, Bali",
        "actionHref": "/journey/journey-bali-01",
        "actionLabel": "Baca Cerita"
      }
    ]
  }'::jsonb))
on conflict (key) do update
set value = excluded.value;

-- ============================================================
-- 12. Final Backfill
-- ============================================================

update public.campaigns campaign
set category = categories.name
from public.categories categories
where campaign.category_id = categories.id
  and (campaign.category is null or campaign.category <> categories.name);

update public.campaigns campaign
set
  current_amount = coalesce(donation_totals.total_amount, 0),
  donor_count = coalesce(donation_totals.total_count, 0)
from (
  select
    campaign_id,
    sum(amount) as total_amount,
    count(*)::integer as total_count
  from public.donations
  where payment_status = 'success'
  group by campaign_id
) donation_totals
where campaign.id = donation_totals.campaign_id;

update public.campaigns
set
  current_amount = coalesce(current_amount, 0),
  donor_count = coalesce(donor_count, 0)
where current_amount is null
   or donor_count is null;
