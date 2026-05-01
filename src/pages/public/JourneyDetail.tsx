import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPinned, Calendar, CheckCircle2, Share2, ArrowRight } from 'lucide-react';
import { fetchImpactMapLocations, type EventMapLocation } from '../../lib/public/events';
import { cn } from '../../lib/utils';
import { useShare } from '../../hooks/useShare';
import ShareToast from '../../components/shared/ShareToast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export default function JourneyDetail() {
  const { id } = useParams<{ id: string }>();
  const [journey, setJourney] = React.useState<EventMapLocation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { share, shareStatus } = useShare();

  React.useEffect(() => {
    async function loadJourney() {
      try {
        setLoading(true);
        const locations = await fetchImpactMapLocations();
        const found = locations.find(loc => loc.id === id);
        if (found) {
          setJourney(found);
        } else {
          setError('Cerita perjalanan tidak ditemukan.');
        }
      } catch (err) {
        setError('Gagal memuat data perjalanan.');
      } finally {
        setLoading(false);
      }
    }
    loadJourney();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{error || 'Tidak ditemukan'}</h2>
        <Link to="/events" className="mt-4 flex items-center gap-2 text-emerald-600 font-bold hover:underline">
          <ArrowLeft size={16} />
          Kembali ke Peta Dampak
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[70vh] w-full overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img 
            src={journey.imageUrl} 
            alt={journey.title} 
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-black/20" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-6 h-full flex flex-col justify-end pb-12">
          <motion.div {...fadeUp}>
            <Link 
              to="/events" 
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Peta
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                STA JOURNEY
              </span>
              <span className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border",
                journey.status === 'Selesai' 
                  ? "bg-emerald-100/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-amber-100/20 text-amber-400 border-amber-500/30"
              )}>
                {journey.status}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight max-w-4xl">
              {journey.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-5xl px-6 -mt-8 relative z-20">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-3">
          {/* Main Story */}
          <motion.div 
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="prose prose-emerald max-w-none">
              <p className="text-base sm:text-xl text-gray-700 leading-relaxed font-serif italic border-l-4 border-emerald-500 pl-4 sm:pl-6 py-2">
                "{journey.description}"
              </p>
              
              <div className="mt-12 space-y-6 text-gray-600 leading-relaxed text-base sm:text-lg">
                {journey.fullContent && journey.fullContent.split('\n').filter(p => p.trim()).map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>

            {journey.images && journey.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 sm:mt-12">
                {journey.images.map((url, idx) => (
                  <div key={idx} className="overflow-hidden rounded-2xl border border-emerald-100 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                    <img 
                      src={url} 
                      alt={`Documentation ${idx + 1}`} 
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Sidebar Info */}
          <aside className="space-y-6">
            <motion.div 
              {...fadeUp}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-white p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 sticky top-24"
            >
              <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-800 mb-6 flex items-center gap-2">
                <MapPinned size={16} />
                Detail Lokasi
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MapPinned size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Wilayah</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{journey.locationLabel}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Periode Jejak</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Agustus 2024</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Capaian</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">100% Selesai</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100">
                <button 
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/20 text-sm"
                  onClick={() => share({
                    title: journey.title,
                    text: journey.description,
                    url: window.location.href
                  })}
                >
                  <Share2 size={16} />
                  Bagikan Cerita
                </button>
              </div>
            </motion.div>
          </aside>
        </div>
      </section>

      {/* Footer Journey */}
      <section className="mx-auto max-w-5xl px-6 mt-24">
        <div className="rounded-[2.5rem] bg-gray-900 p-10 sm:p-16 text-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-6">
              Lanjutkan perjalanan bersama Sekolah Tanah Air
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mb-10 leading-relaxed">
              Masih banyak sekolah yang menunggu jejak kebaikan Anda. Mari bersama kita petakan lebih banyak dampak untuk masa depan Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/campaigns" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors"
              >
                Lihat Campaign Aktif
                <ArrowRight size={18} />
              </Link>
              <Link 
                to="/events" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white/10 text-white font-semibold px-8 py-4 rounded-full border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Kembali ke Peta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ShareToast show={shareStatus === 'copied'} />
    </div>
  );
}
