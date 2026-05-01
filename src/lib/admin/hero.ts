import { supabase } from '../supabase/types';
import type { Json, SiteContentRow } from '../supabase/types';

/* ─────────── Types ─────────── */

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl?: string;
}

export interface HeroContent {
  slides: HeroSlide[];
}

/* ─────────── Constants ─────────── */

export const HERO_CONTENT_KEY = 'home_hero';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    title: 'GOTONG ROYONG BENERIN 1000 SEKOLAH',
    subtitle: 'Membangun harapan dan masa depan anak Indonesia melalui ruang belajar yang aman dan layak.',
    imageUrl: '',
  },
];

/* ─────────── Repository ─────────── */

/**
 * Mengambil data Hero slides dari tabel `site_content`.
 * Jika belum ada data, mengembalikan slide default.
 */
export async function fetchHeroContent(): Promise<HeroContent> {
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', HERO_CONTENT_KEY)
    .maybeSingle();

  if (error || !data) {
    return { slides: DEFAULT_HERO_SLIDES };
  }

  const row = data as unknown as Pick<SiteContentRow, 'value'>;
  if (!row.value) {
    return { slides: DEFAULT_HERO_SLIDES };
  }

  const parsed = row.value as unknown as HeroContent;

  // Validasi struktur data
  if (!parsed?.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    return { slides: DEFAULT_HERO_SLIDES };
  }

  return parsed;
}

/**
 * Menyimpan data Hero slides ke tabel `site_content`.
 * Menggunakan upsert berdasarkan `key` agar selalu hanya ada 1 row.
 */
export async function saveHeroContent(content: HeroContent) {
  const payload = {
    key: HERO_CONTENT_KEY,
    value: content as unknown as Json,
    updated_at: new Date().toISOString(),
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return supabase
    .from('site_content')
    .upsert(payload, { onConflict: 'key' });
}

/* ─────────── Helpers ─────────── */

/**
 * Membuat ID unik sederhana untuk slide baru.
 */
export function createSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Membuat slide kosong baru dengan placeholder values.
 */
export function createEmptySlide(): HeroSlide {
  return {
    id: createSlideId(),
    title: '',
    subtitle: '',
    imageUrl: '',
  };
}
