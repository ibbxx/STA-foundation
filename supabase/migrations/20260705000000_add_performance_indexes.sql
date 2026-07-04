-- 1. Index untuk tabel volunteer_registrations (Admin dashboard & listing)
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_created_at_desc
  ON public.volunteer_registrations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_program_created_at_desc
  ON public.volunteer_registrations(program_id, created_at DESC);

-- 2. Index untuk tabel volunteer_programs (Public listing & hero program)
CREATE INDEX IF NOT EXISTS idx_volunteer_programs_created_at_desc
  ON public.volunteer_programs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_volunteer_programs_show_in_hero_created_at_desc
  ON public.volunteer_programs(show_in_hero, created_at DESC)
  WHERE show_in_hero = true;

-- 3. Index untuk tabel school_reports (Admin dashboard)
CREATE INDEX IF NOT EXISTS idx_school_reports_updated_at_desc
  ON public.school_reports(updated_at DESC);
