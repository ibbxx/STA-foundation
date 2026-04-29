import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, MapPinned } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventMapLocation } from '../../lib/public-events';

// Custom Map Marker using HTML/Tailwind
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="relative flex h-8 w-8 items-center justify-center">
        <div class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"></div>
        <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 shadow-lg border-2 border-white text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface InteractiveMapProps {
  locations?: EventMapLocation[];
  height?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  scrollWheelZoom?: boolean;
  onLocationSelect?: (location: EventMapLocation) => void;
  useFallbackLocations?: boolean;
}

// Default Mock Data for Indonesia
const DEFAULT_LOCATIONS: EventMapLocation[] = [
  {
    id: '1',
    title: 'Renovasi SDN 01 Harapan',
    description: 'Perbaikan atap dan fasilitas sanitasi sekolah.',
    latitude: -6.2088,
    longitude: 106.8456, // Jakarta
    status: 'Selesai',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop',
    slug: 'renovasi-sdn-01-harapan',
    actionHref: '/campaigns/renovasi-sdn-01-harapan',
    actionLabel: 'Lihat Detail',
  },
  {
    id: '2',
    title: 'Perpustakaan Desa Suka Maju',
    description: 'Pembangunan ruang baca ramah anak dengan 1000 buku.',
    latitude: -6.9175,
    longitude: 107.6191, // Bandung
    status: 'Berjalan',
    imageUrl: 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=600&auto=format&fit=crop',
    slug: 'perpustakaan-desa-suka-maju',
    actionHref: '/campaigns/perpustakaan-desa-suka-maju',
    actionLabel: 'Lihat Detail',
  },
  {
    id: '3',
    title: 'Fasilitas Air Bersih Pelosok',
    description: 'Instalasi sumur bor dan penyaringan air bersih untuk warga sekolah.',
    latitude: -5.1477,
    longitude: 119.4327, // Makassar
    status: 'Selesai',
    imageUrl: 'https://images.unsplash.com/photo-1541819053896-e2a225301826?q=80&w=600&auto=format&fit=crop',
    slug: 'fasilitas-air-bersih-pelosok',
    actionHref: '/campaigns/fasilitas-air-bersih-pelosok',
    actionLabel: 'Lihat Detail',
  },
  {
    id: '4',
    title: 'Pelatihan Guru Indonesia Timur',
    description: 'Workshop literasi digital untuk 50 guru daerah tertinggal.',
    latitude: -2.5337,
    longitude: 140.7181, // Jayapura
    status: 'Berjalan',
    imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=600&auto=format&fit=crop',
    slug: 'pelatihan-guru-indonesia-timur',
    actionHref: '/campaigns/pelatihan-guru-indonesia-timur',
    actionLabel: 'Lihat Detail',
  },
];

function MapBoundsController({ locations }: { locations: EventMapLocation[] }) {
  const map = useMap();

  React.useEffect(() => {
    if (locations.length === 0) return;

    const bounds = L.latLngBounds(locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: locations.length === 1 ? 8 : 6 });
  }, [locations, map]);

  return null;
}

function MapActionButton({ location }: { location: EventMapLocation }) {
  if (!location.actionHref) return null;

  if (/^https?:\/\//.test(location.actionHref)) {
    return (
      <a
        href={location.actionHref}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        {location.actionLabel ?? 'Lihat Detail'}
        <ArrowRight className="h-3 w-3" />
      </a>
    );
  }

  return (
    <Link
      to={location.actionHref}
      className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
    >
      {location.actionLabel ?? 'Lihat Detail'}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

export default function InteractiveMap({
  locations,
  height = '500px',
  emptyTitle = 'Belum ada event dipublikasikan',
  emptyDescription = 'Lokasi kegiatan akan muncul di sini setelah data peta dampak tersedia.',
  scrollWheelZoom = false,
  onLocationSelect,
  useFallbackLocations = true,
}: InteractiveMapProps) {
  const customIcon = useMemo(() => createCustomIcon(), []);
  const hasLocations = Boolean(locations && locations.length > 0);
  const normalizedLocations = hasLocations ? locations! : (useFallbackLocations ? DEFAULT_LOCATIONS : []);
  const shouldShowEmptyOverlay = !hasLocations && !useFallbackLocations;

  // Center on Indonesia
  const center: [number, number] = [-0.7893, 113.9213]; 
  const zoom = 5;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm" style={{ height }}>
      {shouldShowEmptyOverlay && (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
              <MapPinned className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{emptyTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{emptyDescription}</p>
            </div>
          </div>
        </div>
      )}
      {/* 
        Menghilangkan z-index default leaflet yang sering bentrok dengan navbar/modal 
        dengan mengatur z-index root map container.
      */}
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={scrollWheelZoom}
        className="z-0 h-full w-full"
      >
        {/* Menggunakan CartoDB Positron untuk tampilan peta yang bersih dan terang */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapBoundsController locations={normalizedLocations} />

        {normalizedLocations.map((loc) => (
          <Marker 
            key={loc.id} 
            position={[loc.latitude, loc.longitude]} 
            icon={customIcon}
            eventHandlers={{
              click: () => onLocationSelect?.(loc),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="flex w-64 flex-col overflow-hidden rounded-xl border-0">
                <div className="relative h-32 w-full overflow-hidden">
                  <img 
                    src={loc.imageUrl} 
                    alt={loc.title} 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-700 backdrop-blur-sm uppercase">
                    {loc.status}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                    {loc.title}
                  </h3>
                  {loc.locationLabel ? (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                      {loc.locationLabel}
                    </p>
                  ) : null}
                  <p className="mb-3 text-xs text-gray-600 line-clamp-2">
                    {loc.description}
                  </p>
                  <MapActionButton location={loc} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
