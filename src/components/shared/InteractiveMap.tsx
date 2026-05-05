import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import type { MapRef } from '@vis.gl/react-maplibre';
import type { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowRight, MapPinned, X, Layers, Maximize2, Plus, Minus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { EventMapLocation } from '../../lib/public/events';
import { cn } from '../../lib/utils';

// ─── Map tile styles ───────────────────────────────────────────────────────────

const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [{ id: 'satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 19 }],
} as const;

const ESRI_STREETS_STYLE = {
  version: 8,
  sources: {
    'esri-streets': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri',
    },
  },
  layers: [{ id: 'streets-layer', type: 'raster', source: 'esri-streets', minzoom: 0, maxzoom: 19 }],
} as const;

// ─── Types & constants ─────────────────────────────────────────────────────────

export interface InteractiveMapProps {
  locations?: EventMapLocation[];
  height?: string;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  scrollWheelZoom?: boolean;
  onLocationSelect?: (location: EventMapLocation) => void;
  onClick?: (e: any) => void;
  useFallbackLocations?: boolean;
  viewportMode?: 'default' | 'fit-indonesia';
  showControls?: boolean;
}

const DESKTOP_VIEW_STATE = { longitude: 118.0, latitude: -2.5, zoom: 4 } as const;

const INDONESIA_BOUNDS: LngLatBoundsLike = [[94.0, -11.0], [142.0, 6.5]];

/** Popup card dimensions (CSS px). Keep in sync with the rendered card. */
const POPUP_W = 224; // w-56
const POPUP_H = 260; // approx full height
const POPUP_H_COMPACT = 210;
const EDGE_PAD = 12;  // min gap to container edge
const MARKER_GAP = 14; // gap between marker tip and popup edge

// ─── Default fallback data ──────────────────────────────────────────────────────

const DEFAULT_LOCATIONS: EventMapLocation[] = [
  { id: '1', title: 'Renovasi SDN 01 Harapan', description: 'Perbaikan atap dan fasilitas sanitasi sekolah.', latitude: -6.2088, longitude: 106.8456, status: 'Selesai', imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=600&auto=format&fit=crop', slug: 'renovasi-sdn-01-harapan', actionHref: '/journey/1', actionLabel: 'Lihat Detail', images: [] },
  { id: '2', title: 'Perpustakaan Desa Suka Maju', description: 'Pembangunan ruang baca ramah anak dengan 1000 buku.', latitude: -6.9175, longitude: 107.6191, status: 'Berjalan', imageUrl: 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?q=80&w=600&auto=format&fit=crop', slug: 'perpustakaan-desa-suka-maju', actionHref: '/journey/2', actionLabel: 'Lihat Detail', images: [] },
  { id: '3', title: 'Fasilitas Air Bersih Pelosok', description: 'Instalasi sumur bor dan penyaringan air bersih.', latitude: -5.1477, longitude: 119.4327, status: 'Selesai', imageUrl: 'https://images.unsplash.com/photo-1541819053896-e2a225301826?q=80&w=600&auto=format&fit=crop', slug: 'fasilitas-air-bersih-pelosok', actionHref: '/journey/3', actionLabel: 'Lihat Detail', images: [] },
  { id: '4', title: 'Pelatihan Guru Indonesia Timur', description: 'Workshop literasi digital untuk 50 guru daerah tertinggal.', latitude: -2.5337, longitude: 140.7181, status: 'Berjalan', imageUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=600&auto=format&fit=crop', slug: 'pelatihan-guru-indonesia-timur', actionHref: '/journey/4', actionLabel: 'Lihat Detail', images: [] },
];

// ─── Helper: action button ──────────────────────────────────────────────────────

function MapActionButton({ location }: { location: EventMapLocation }) {
  if (!location.actionHref) return null;
  const cls = 'flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 shadow-sm';

  // Normalisasi actionHref ke /journey/ jika masih /campaigns/
  let href = location.actionHref;
  if (!href && location.id) {
    href = `/journey/${location.slug || location.id}`;
  }

  if (href && href.startsWith('/campaigns/')) {
    href = href.replace('/campaigns/', '/journey/');
  }

  if (!href) return null;

  if (/^https?:\/\//.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer" className={cls}>{location.actionLabel ?? 'Lihat Detail'}<ArrowRight className="h-3 w-3" /></a>;
  }
  return <Link to={href} className={cls}>{location.actionLabel ?? 'Lihat Detail'}<ArrowRight className="h-3 w-3" /></Link>;
}

// ─── Main component ────────────────────────────────────────────────────────────

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
  showControls = true,
  onClick,
}: InteractiveMapProps) {
  const [popupInfo, setPopupInfo] = useState<EventMapLocation | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const mapRef = useRef<MapRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const hasLocations = Boolean(locations && locations.length > 0);
  const normalizedLocations = hasLocations ? locations! : (useFallbackLocations ? DEFAULT_LOCATIONS : []);
  const shouldShowEmptyOverlay = !hasLocations && !useFallbackLocations;

  // ── Map load / Indonesia fit ───────────────────────────────────────────────

  const handleMapLoad = (e: any) => {
    setMapReady(true);
    if (viewportMode === 'fit-indonesia') {
      e.target.fitBounds(INDONESIA_BOUNDS, { padding: 16, duration: 0 });
    }
  };

  useEffect(() => {
    if (!mapReady || viewportMode !== 'fit-indonesia' || popupInfo) return;
    mapRef.current?.fitBounds(INDONESIA_BOUNDS, { padding: 16, duration: 300 });
  }, [mapReady, viewportMode, popupInfo]);

  useEffect(() => {
    if (!mapReady || viewportMode !== 'fit-indonesia') return;
    const onResize = () => {
      if (popupInfo) return;
      mapRef.current?.fitBounds(INDONESIA_BOUNDS, { padding: 16, duration: 0 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mapReady, viewportMode, popupInfo]);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-[#0a1118] shadow-2xl', className)}
      style={height ? { height } : undefined}
    >
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

      {/* ── MapLibre Map ──────────────────────────────────────────────────── */}
      <Map
        ref={mapRef}
        initialViewState={DESKTOP_VIEW_STATE}
        maxBounds={popupInfo ? undefined : INDONESIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        mapStyle={(mapStyle === 'satellite' ? ESRI_SATELLITE_STYLE : ESRI_STREETS_STYLE) as any}
        scrollZoom={false}
        dragRotate={false}
        touchPitch={false}
        cooperativeGestures={true}
        onLoad={handleMapLoad}
        onClick={onClick}
        attributionControl={false}
      >
        {/* Controls */}
        {showControls && (
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setMapStyle(prev => prev === 'satellite' ? 'streets' : 'satellite')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80"
              title={mapStyle === 'satellite' ? 'Switch to Street View' : 'Switch to Satellite View'}
            >
              <Layers className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (mapRef.current) {
                  const map = mapRef.current.getMap();
                  map.zoomIn({ duration: 300 });
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80"
              title="Zoom In"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (mapRef.current) {
                  const map = mapRef.current.getMap();
                  map.zoomOut({ duration: 300 });
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80"
              title="Zoom Out"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              onClick={() => mapRef.current?.fitBounds(INDONESIA_BOUNDS, { padding: 40, duration: 1000 })}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80"
              title="Reset View"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Markers */}
        {normalizedLocations.map((loc) => (
          <Marker
            key={loc.id}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();

              // Saat marker diklik, pusatkan peta ke marker tersebut
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [loc.longitude, loc.latitude],
                  offset: [0, 0],
                  zoom: 8,
                  duration: 800,
                  essential: true
                });
              }

              setPopupInfo(prev => prev?.id === loc.id ? null : loc);
              onLocationSelect?.(loc);
            }}
          >
            <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center">
              <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <div className={cn(
                'relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] text-white transition-transform duration-300 hover:scale-125 hover:bg-emerald-400',
                popupInfo?.id === loc.id && 'scale-125 bg-emerald-400',
              )} />
            </div>
          </Marker>
        ))}
      </Map>

      {/* ── Centered Floating Card Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {popupInfo && (
          <motion.div
            key={popupInfo.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto relative">
              {/* Card */}
              <div className="w-[85vw] sm:w-64 overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl backdrop-blur-xl">
                {/* Close Button */}
                <button
                  onClick={() => setPopupInfo(null)}
                  className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1.5 text-white/80 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Image */}
                <div className="relative h-32 w-full overflow-hidden bg-gray-800">
                  <img
                    src={popupInfo.imageUrl}
                    alt={popupInfo.title}
                    className="h-full w-full object-cover opacity-90 transition-opacity hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent" />
                  <div className="absolute bottom-2 left-2 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
                    {popupInfo.status}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-3">
                  <h3 className="mb-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-white">{popupInfo.title}</h3>
                  {popupInfo.locationLabel && (
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-400">{popupInfo.locationLabel}</p>
                  )}
                  <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-gray-300">{popupInfo.description}</p>
                  <MapActionButton location={popupInfo} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
