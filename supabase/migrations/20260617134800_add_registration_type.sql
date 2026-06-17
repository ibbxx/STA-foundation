-- 1. Tambah kolom registration_type ke tabel volunteer_registrations
ALTER TABLE public.volunteer_registrations
ADD COLUMN IF NOT EXISTS registration_type text NOT NULL DEFAULT 'reguler'
CONSTRAINT volunteer_registrations_type_check 
CHECK (registration_type = ANY (ARRAY['reguler'::text, 'beasiswa'::text]));

-- 2. Buat index pencarian untuk performa kelompok jalur pendaftaran
CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_type_program
ON public.volunteer_registrations(program_id, registration_type);

-- 3. Tambah kolom tanggal penjadwalan status ke tabel volunteer_programs
ALTER TABLE public.volunteer_programs
ADD COLUMN IF NOT EXISTS registration_start timestamptz,
ADD COLUMN IF NOT EXISTS registration_end timestamptz,
ADD COLUMN IF NOT EXISTS program_end timestamptz;
