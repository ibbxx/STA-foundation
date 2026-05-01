import { supabase } from '../supabase/types';
import type { Json, SiteContentRow } from '../supabase/types';

export interface HomeProgramSlide {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  imageUrl: string; // Gambar untuk sticky scroll
  heroImageUrl?: string; // Gambar utama halaman detail
  galleryImages?: string[]; // 4 Gambar untuk bagian filosofi/galeri detail
  overview?: string;
  focus_areas?: string[];
}

export interface HomeProgramsContent {
  slides: HomeProgramSlide[];
}

export const HOME_PROGRAMS_KEY = 'home_programs';

export const DEFAULT_HOME_PROGRAMS: HomeProgramSlide[] = [
  {
    id: 'program-1',
    slug: 'jelajah-tanah-air',
    title: 'Jelajah Tanah Air',
    short_description: 'Tahap awal fokus pada survei, identifikasi permasalahan pendidikan, pemetaan kondisi sekolah/desa, dan riset potensi lokal.',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'program-2',
    slug: 'eduxplore-tanah-air',
    title: 'EduXplore Tanah Air',
    short_description: 'Aktivitas mengajar, eksplorasi budaya, penerapan kurikulum hijau, perpustakaan digital, serta pengenalan teknologi dan AI.',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'program-3',
    slug: 'bangun-1000-asa',
    title: 'Bangun 1000 Asa',
    short_description: 'Implementasi pembangunan atau renovasi sekolah, pengadaan alat digital, peningkatan kapasitas guru, dan monitoring berkelanjutan.',
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800',
  },
];

export async function fetchHomeProgramsContent(): Promise<HomeProgramsContent> {
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', HOME_PROGRAMS_KEY)
    .maybeSingle();

  if (error || !data) return { slides: DEFAULT_HOME_PROGRAMS };

  const row = data as unknown as Pick<SiteContentRow, 'value'>;
  if (!row.value) return { slides: DEFAULT_HOME_PROGRAMS };

  const parsed = row.value as unknown as HomeProgramsContent;
  if (!parsed?.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    return { slides: DEFAULT_HOME_PROGRAMS };
  }

  return parsed;
}

export async function saveHomeProgramsContent(content: HomeProgramsContent) {
  const payload = {
    key: HOME_PROGRAMS_KEY,
    value: content as unknown as Json,
    updated_at: new Date().toISOString(),
  } as any;

  return supabase
    .from('site_content')
    .upsert(payload, { onConflict: 'key' });
}

export function createEmptyHomeProgram(): HomeProgramSlide {
  return {
    id: `hp-${Date.now()}`,
    slug: '',
    title: '',
    short_description: '',
    imageUrl: '',
  };
}
