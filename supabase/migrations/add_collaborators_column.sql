-- 1. Tambah kolom collaborators
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS collaborators jsonb DEFAULT '[]'::jsonb;

-- 2. Inject contoh data collaborators untuk campaign "SUMBANGAN PITTI"
UPDATE public.campaigns
SET collaborators = '[
  {
    "id": "1",
    "name": "Kawan Cendekia",
    "role": "Mitra Pendidikan",
    "quote": "Pendidikan yang layak adalah jembatan menuju masa depan gemilang bagi anak-anak desa.",
    "avatar": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150"
  },
  {
    "id": "2",
    "name": "PIS Movement",
    "role": "Mitra Lapangan",
    "quote": "Kami memastikan setiap rupiah donasi Anda menjadi bata, semen, dan meja belajar yang nyata.",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
  }
]'::jsonb
WHERE title = 'SUMBANGAN PITTI';
