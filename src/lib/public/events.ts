import { supabase, type Json, type SiteContentRow } from '../supabase/types';

export type EventMapLocation = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  status: 'Berjalan' | 'Selesai' | 'Akan Datang';
  slug?: string | null;
  province?: string | null;
  locationLabel?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
  images: string[];
  fullContent?: string | null;
};

type ImpactMapPayload = {
  locations: EventMapLocation[];
};

const LEGACY_COORDINATE_LOOKUP: Record<string, { latitude: number; longitude: number }> = {
  pujananting: { latitude: -4.417, longitude: 119.736 },
  silangjana: { latitude: -8.192, longitude: 114.956 },
  cisalada: { latitude: -6.826, longitude: 107.142 },
  uning_mas: { latitude: 4.729, longitude: 96.834 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toStatus(value: unknown): EventMapLocation['status'] {
  if (typeof value !== 'string') return 'Berjalan';

  const normalized = value.trim().toLowerCase();
  if (['selesai', 'completed', 'complete', 'done'].includes(normalized)) return 'Selesai';
  if (['akan datang', 'upcoming', 'planned', 'draft'].includes(normalized)) return 'Akan Datang';
  return 'Berjalan';
}

function inferLegacyCoordinates(location: Record<string, unknown>) {
  const id = toText(location.id)?.toLowerCase();
  if (id && LEGACY_COORDINATE_LOOKUP[id]) return LEGACY_COORDINATE_LOOKUP[id];

  const province = toText(location.province)?.toLowerCase() ?? '';
  if (province.includes('aceh')) return { latitude: 4.695, longitude: 96.749 };
  if (province.includes('jawa barat')) return { latitude: -6.903, longitude: 107.618 };
  if (province.includes('bali')) return { latitude: -8.409, longitude: 115.188 };
  if (province.includes('sulawesi selatan')) return { latitude: -3.668, longitude: 119.974 };

  return null;
}

function parseLocation(location: unknown, index: number): EventMapLocation | null {
  if (!isRecord(location)) return null;

  const latitude = toNumber(location.latitude);
  const longitude = toNumber(location.longitude);
  const inferred = latitude !== null && longitude !== null
    ? { latitude, longitude }
    : inferLegacyCoordinates(location);

  if (!inferred) return null;

  const slug = toText(location.slug);
  const actionHref = toText(location.action_href) ?? toText(location.actionHref) ?? (slug ? `/campaigns/${slug}` : null);
  const actionLabel = toText(location.action_label) ?? toText(location.actionLabel) ?? (actionHref ? 'Lihat Detail' : null);
  const title = toText(location.title) ?? toText(location.name) ?? `Lokasi ${index + 1}`;
  const province = toText(location.province);
  const locationLabel = toText(location.location_label) ?? toText(location.locationLabel) ?? province;

  return {
    id: toText(location.id) ?? `impact-location-${index + 1}`,
    title,
    description:
      toText(location.description)
      ?? `Dokumentasi kegiatan Sekolah Tanah Air di ${locationLabel ?? title}.`,
    imageUrl:
      toText(location.image_url)
      ?? toText(location.imageUrl)
      ?? 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop',
    latitude: inferred.latitude,
    longitude: inferred.longitude,
    status: toStatus(location.status),
    slug,
    province,
    locationLabel,
    actionHref,
    actionLabel,
    images: Array.isArray(location.images) ? location.images.map(img => String(img)) : [],
    fullContent: toText(location.full_content) ?? toText(location.fullContent),
  };
}

export function mapImpactMapValue(value: Json | null): ImpactMapPayload {
  if (!isRecord(value) || !Array.isArray(value.locations)) {
    return { locations: [] };
  }

  return {
    locations: value.locations
      .map((location, index) => parseLocation(location, index))
      .filter((location): location is EventMapLocation => Boolean(location)),
  };
}

export async function fetchImpactMapLocations(): Promise<EventMapLocation[]> {
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'impact_map')
    .limit(1);

  if (error) {
    throw error;
  }

  const row = (data?.[0] ?? null) as Pick<SiteContentRow, 'value'> | null;
  return mapImpactMapValue(row?.value ?? null).locations;
}
