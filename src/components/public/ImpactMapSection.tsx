import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/shared/InteractiveMap';
import { fetchImpactMapLocations, type EventMapLocation } from '../../lib/public-events';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

export default function ImpactMapSection() {
  const [mapLocations, setMapLocations] = React.useState<EventMapLocation[]>([]);
  const [loadingMap, setLoadingMap] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;

    async function loadMapData() {
      setLoadingMap(true);
      try {
        const locs = await fetchImpactMapLocations();
        if (!ignore) setMapLocations(locs);
      } catch (err) {
        console.error("Failed to load map locations:", err);
      } finally {
        if (!ignore) setLoadingMap(false);
      }
    }
    loadMapData();

    return () => { ignore = true; };
  }, []);

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-xs mb-3 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-emerald-600"></span>
              Peta Dampak
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
              Jejak Aksi Nyata Kami
            </h2>
            <p className="mt-3 md:mt-4 text-gray-600 text-sm md:text-lg leading-relaxed font-light">
              Eksplorasi sebaran kegiatan Sekolah Tanah Air di berbagai penjuru Indonesia. 
              Klik titik lokasi untuk melihat detail aksi yang telah dilakukan.
            </p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors group"
            >
              Lihat Semua Lokasi
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100"
        >
          <InteractiveMap 
            locations={mapLocations}
            height="min(500px, 70vh)"
            className="w-full"
            useFallbackLocations={true}
            viewportMode="fit-indonesia"
            scrollWheelZoom={false}
          />
          {loadingMap && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" />
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Memetakan Dampak...</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
