import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef } from '@vis.gl/react-maplibre';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowRight, MapPinned, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventMapLocation } from '../../lib/public-events';
import { cn } from '../../lib/utils';

// MapStyle menggunakan Esri World Imagery (Satelit Resolusi Tinggi, Gratis tanpa API Key)
const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
} as const;

interface InteractiveMapProps {
  locations?: EventMapLocation[];
  height?: string;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  scrollWheelZoom?: boolean;
  onLocationSelect?: (location: EventMapLocation) => void;
  useFallbackLocations?: boolean;
  viewportMode?: 'default' | 'fit-indonesia';
}

const DESKTOP_VIEW_STATE = {
  longitude: 118.0,
  latitude: -2.5,
  zoom: 4,
} as const;

const INDONESIA_BOUNDS: LngLatBoundsLike = [
  [94.0, -11.0],
  [142.0, 6.5],
];



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

function MapActionButton({ location }: { location: EventMapLocation }) {
  if (!location.actionHref) return null;

  if (/^https?:\/\//.test(location.actionHref)) {
    return (
      <a
        href={location.actionHref}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 shadow-sm"
      >
        {location.actionLabel ?? 'Lihat Detail'}
        <ArrowRight className="h-3 w-3" />
      </a>
    );
  }

  return (
    <Link
      to={location.actionHref}
      className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 shadow-sm"
    >
      {location.actionLabel ?? 'Lihat Detail'}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

export default function InteractiveMap({
  locations,
  height,
  className,
  emptyTitle = 'Belum ada event dipublikasikan',
  emptyDescription = 'Lokasi kegiatan akan muncul di sini setelah data peta dampak tersedia.',
  scrollWheelZoom = false,
  onLocationSelect,
  useFallbackLocations = true,
  viewportMode = 'default',
}: InteractiveMapProps) {
  const [popupInfo, setPopupInfo] = useState<EventMapLocation | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapRef | null>(null);

  const hasLocations = Boolean(locations && locations.length > 0);
  const normalizedLocations = hasLocations ? locations! : (useFallbackLocations ? DEFAULT_LOCATIONS : []);
  const shouldShowEmptyOverlay = !hasLocations && !useFallbackLocations;

  const mapInitialViewState = DESKTOP_VIEW_STATE;

  const handleMapLoad = (e: any) => {
    setMapReady(true);
    if (viewportMode === 'fit-indonesia') {
      e.target.fitBounds(INDONESIA_BOUNDS, {
        padding: 16,
        duration: 0,
      });
    }
  };

  useEffect(() => {
    if (!mapReady || viewportMode !== 'fit-indonesia') return;

    const map = mapRef.current;
    if (!map) return;

    map.fitBounds(INDONESIA_BOUNDS, {
      padding: 16,
      duration: 300,
    });
  }, [mapReady, viewportMode]);

  useEffect(() => {
    if (!mapReady || viewportMode !== 'fit-indonesia') return;

    const handleResize = () => {
      mapRef.current?.fitBounds(INDONESIA_BOUNDS, {
        padding: 16,
        duration: 0,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapReady, viewportMode]);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-[#0a1118] shadow-2xl", className)} style={height ? { height } : undefined}>
      {shouldShowEmptyOverlay && (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-2xl border border-amber-500/30 bg-black/60 px-4 py-3 shadow-sm backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-500/20 p-2 text-amber-400">
              <MapPinned className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{emptyTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-300">{emptyDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* MapLibre GL JS Wrapper */}
      <Map
        ref={mapRef}
        initialViewState={mapInitialViewState}
        maxBounds={INDONESIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        mapStyle={ESRI_SATELLITE_STYLE as any}
        scrollZoom={scrollWheelZoom}
        dragRotate={false}
        touchPitch={false}
        onLoad={handleMapLoad}
      >
        {normalizedLocations.map((loc) => (
          <Marker
            key={loc.id}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo(loc);
              onLocationSelect?.(loc);
            }}
          >
            {/* Premium Animated Map Marker */}
            <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center">
              <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70"></div>
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-2 border-white text-white transition-transform duration-300 hover:scale-125 hover:bg-emerald-400">
              </div>
            </div>
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            anchor="bottom"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            closeButton={false} // Kita custom close button sendiri
            offset={20}
            className="maplibre-satellite-popup"
            maxWidth="300px"
          >
            <div className="relative flex w-56 sm:w-64 flex-col overflow-hidden rounded-xl bg-gray-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
              {/* Custom Close Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupInfo(null);
                }}
                className="absolute top-2 right-2 z-10 rounded-full bg-black/40 p-1.5 text-white/80 hover:bg-black/80 hover:text-white transition-colors backdrop-blur-md"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="relative h-36 w-full overflow-hidden bg-gray-800">
                <img 
                  src={popupInfo.imageUrl} 
                  alt={popupInfo.title} 
                  className="h-full w-full object-cover opacity-90 transition-opacity hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
                <div className="absolute left-3 bottom-3 rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-bold tracking-wider text-white backdrop-blur-sm uppercase shadow-sm">
                  {popupInfo.status}
                </div>
              </div>
              <div className="p-4 pt-3">
                <h3 className="mb-1 text-sm font-bold text-white leading-tight line-clamp-2">
                  {popupInfo.title}
                </h3>
                {popupInfo.locationLabel && (
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                    {popupInfo.locationLabel}
                  </p>
                )}
                <p className="mb-4 text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {popupInfo.description}
                </p>
                <MapActionButton location={popupInfo} />
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
