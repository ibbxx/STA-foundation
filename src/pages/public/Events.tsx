import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, MapPinned, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/shared/InteractiveMap';
import { logError } from '../../lib/error-logger';
import { supabase } from '../../lib/supabase/types';
import { fetchImpactMapLocations, type EventMapLocation } from '../../lib/public/events';
import { cn } from '../../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

function EventActionLink({ event }: { event: EventMapLocation }) {
  if (!event.actionHref) return null;

  const label = event.actionLabel ?? 'Lihat Detail';

  if (/^https?:\/\//.test(event.actionHref)) {
    return (
      <a
        href={event.actionHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </a>
    );
  }

  return (
    <Link
      to={event.actionHref}
      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function Events() {
  const [locations, setLocations] = React.useState<EventMapLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [heroImage, setHeroImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadHero() {
      try {
        const { data } = await supabase.from('site_content').select('value').eq('key', 'hero_events').single();
        if (data && (data as any).value) {
          const val = (data as any).value;
          const parsed = typeof val === 'string' ? JSON.parse(val) : val;
          if (parsed.imageUrl) setHeroImage(parsed.imageUrl);
        }
      } catch (e) { }
    }
    loadHero();
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function loadLocations() {
      setLoading(true);
      setError(null);

      try {
        const nextLocations = await fetchImpactMapLocations();
        if (ignore) return;

        setLocations(nextLocations);
        setSelectedLocationId(nextLocations[0]?.id ?? null);
      } catch (loadError) {
        logError('Events.loadLocations', loadError);
        if (ignore) return;

        setLocations([]);
        setSelectedLocationId(null);
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data event.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadLocations();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;
  const stats = React.useMemo(() => {
    const provinceCount = new Set(
      locations.map((location) => location.province ?? location.locationLabel ?? location.title),
    ).size;

    return [
      { label: 'Lokasi Terdokumentasi', value: locations.length },
      { label: 'Wilayah Terpetakan', value: provinceCount },
      { label: 'Sedang Berjalan', value: locations.filter((location) => location.status === 'Berjalan').length },
      { label: 'Selesai', value: locations.filter((location) => location.status === 'Selesai').length },
    ];
  }, [locations]);

  return (
    <div className="bg-[#FAF9F6] text-gray-900">
      <section className="relative min-h-[100svh] w-full flex flex-col justify-end md:justify-center overflow-hidden bg-gray-900">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={heroImage} className="w-full h-full object-cover" alt="Event & Aksi" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent md:bg-gradient-to-r md:from-gray-900/90 md:via-gray-900/40 md:to-transparent" />
          </div>
        )}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 pb-12 md:pb-0 pt-24 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:max-w-2xl"
          >
            <h1 className="text-[18px] sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.3] md:leading-tight mb-3 md:mb-6 tracking-tight">
              Menelusuri Setiap Jejak Kebaikan
            </h1>
            <p className="text-[11px] sm:text-[13px] md:text-base text-gray-300 leading-relaxed font-light mb-6 md:mb-10 max-w-xl">
              Dari pesisir hingga pegunungan, saksikan bagaimana setiap dukungan Anda bertransformasi menjadi aksi nyata bagi pendidikan di seluruh pelosok Nusantara.
            </p>
            <div className="flex flex-row items-center gap-2.5 sm:gap-4">
              <Link
                to="/campaigns"
                className="inline-flex h-9 sm:h-10 md:h-12 items-center justify-center gap-1.5 md:gap-2 rounded-full bg-emerald-600 px-4 sm:px-6 md:px-8 text-[10px] sm:text-[12px] md:text-sm font-bold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
              >
                Jelajahi Campaign
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
              <Link
                to="/laporkan"
                className="inline-flex h-9 sm:h-10 md:h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 sm:px-6 md:px-8 text-[10px] sm:text-[12px] md:text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                Laporkan Sekolah
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-emerald-100/30 bg-[#F7F4EC]/50 py-3 sm:py-5">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-sm sm:text-lg md:text-2xl font-black tracking-tight text-gray-900 leading-none">{stat.value}</p>
                <p className="mt-1 text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 leading-none truncate">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {error ? (
            <div className="rounded-3xl border border-red-100 bg-white px-6 py-8 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-30px_rgba(17,24,39,0.18)]"
            >
              <InteractiveMap
                locations={locations}
                className="w-full aspect-video sm:aspect-[2/1] lg:aspect-[2.5/1]"
                scrollWheelZoom={true}
                useFallbackLocations={false}
                viewportMode="fit-indonesia"
                emptyTitle={loading ? 'Memuat data event...' : 'Belum ada titik event yang dipublikasikan'}
                emptyDescription={
                  loading
                    ? 'Peta akan otomatis terisi setelah data berhasil dimuat.'
                    : ''
                }
                onLocationSelect={(location) => setSelectedLocationId(location.id)}
              />
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                <span className="h-[2px] w-8 bg-emerald-600" />
                Daftar Lokasi
              </p>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                Jurnal Perjalanan Kami
              </h2>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                  <div className="h-48 animate-pulse bg-gray-100" />
                  <div className="space-y-3 p-6">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-6 w-2/3 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-16 animate-pulse rounded-2xl bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-100 bg-white px-6 py-8 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          ) : locations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-base font-bold text-gray-900">Belum ada event yang siap ditampilkan.</p>
              <p className="mt-2 text-sm text-gray-600">
                Setelah data impact map dipublikasikan, daftar lokasi kegiatan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {locations.map((event, index) => (
                <motion.article
                  key={event.id}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.05 }}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
                    selectedLocationId === event.id
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-gray-100 hover:border-emerald-200 hover:shadow-md',
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute left-2 top-2 rounded-lg bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 backdrop-blur-sm shadow-sm border border-emerald-50">
                      {event.status}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-3 sm:p-4">
                    <div className="flex-1 min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                        <MapPinned className="h-3 w-3" />
                        <span className="truncate">{event.locationLabel ?? 'Lokasi Event'}</span>
                      </p>
                      <h3 className="text-sm sm:text-base font-black tracking-tight text-gray-900 line-clamp-1 mb-1.5">{event.title}</h3>
                      <p className="text-[11px] sm:text-xs leading-relaxed text-gray-500 line-clamp-2">{event.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                      <EventActionLink event={event} />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-[2rem] border border-emerald-100 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="mb-3 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  <span className="h-[2px] w-8 bg-emerald-600" />
                  KONTRIBUSI NYATA
                </p>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                  Bantu Kami Memperluas Jejak Kebaikan
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                  Setiap informasi yang Anda berikan adalah langkah awal bagi perubahan. Laporkan kondisi sekolah di sekitar Anda atau hubungi kami untuk kolaborasi aksi nyata selanjutnya.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/laporkan"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#2C5F4F] px-6 text-sm font-bold text-[#F5F1E8] transition-colors hover:bg-[#234A3D]"
                >
                  Laporkan Sekolah
                </Link>
                <Link
                  to="/kontak"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
                >
                  Hubungi Tim STA
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
