-- Add new fields to volunteer_registrations
ALTER TABLE public.volunteer_registrations 
ADD COLUMN IF NOT EXISTS pendidikan text,
ADD COLUMN IF NOT EXISTS bidang_diminati text;

-- Add comment for documentation
COMMENT ON COLUMN public.volunteer_registrations.pendidikan IS 'Latar belakang pendidikan pendaftar';
COMMENT ON COLUMN public.volunteer_registrations.bidang_diminati IS 'Bidang yang diminati pendaftar';
