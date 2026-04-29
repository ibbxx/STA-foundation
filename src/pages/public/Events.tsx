import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, MapPinned, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/shared/InteractiveMap';
import { logError } from '../../lib/error-logger';
import { fetchImpactMapLocations, type EventMapLocation } from '../../lib/public-events';
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
      <section className="border-b border-emerald-100/80 bg-white pt-28 sm:pt-32">
        <div className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 sm:pb-16 lg:px-8">
          <motion.div {...fadeUp} className="max-w-4xl">
            <p className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
              <span className="h-[2px] w-8 bg-emerald-600" />
              Event STA
            </p>
            <h1 className="max-w-4xl text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Jejak Kegiatan Sekolah Tanah Air di Berbagai Pelosok Indonesia
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Halaman ini memvisualisasikan titik-titik kegiatan yang telah dan sedang dijalankan Sekolah Tanah Air,
              agar publik dapat melihat persebaran aksi, konteks wilayah, dan arah dampak yang sedang dibangun.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/campaigns"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C5F4F] px-6 text-sm font-bold text-[#F5F1E8] transition-colors hover:bg-[#234A3D]"
              >
                Jelajahi Campaign
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/laporkan"
                className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-200 px-6 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                Laporkan Sekolah
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-emerald-100/80 bg-[#F7F4EC] py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/80 bg-white/80 px-4 py-4 shadow-sm">
              <p className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-gray-500">{stat.label}</p>
            </div>
          ))}
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
                Event dan Titik Kegiatan
              </h2>
            </div>
            {selectedLocation ? (
              <p className="text-sm text-gray-600">
                Fokus saat ini: <span className="font-semibold text-gray-900">{selectedLocation.title}</span>
              </p>
            ) : null}
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
          ) : locations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-base font-bold text-gray-900">Belum ada event yang siap ditampilkan.</p>
              <p className="mt-2 text-sm text-gray-600">
                Setelah data impact map dipublikasikan, daftar lokasi kegiatan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {locations.map((event, index) => (
                <motion.article
                  key={event.id}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.05 }}
                  className={cn(
                    'overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300',
                    selectedLocationId === event.id
                      ? 'border-emerald-300 shadow-[0_16px_40px_-28px_rgba(5,150,105,0.55)]'
                      : 'border-gray-100 hover:border-emerald-200 hover:shadow-[0_16px_40px_-28px_rgba(17,24,39,0.18)]',
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 backdrop-blur-sm">
                      {event.status}
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                        <MapPinned className="h-3.5 w-3.5 text-emerald-700" />
                        {event.locationLabel ?? 'Lokasi Event'}
                      </p>
                      <h3 className="text-xl font-black tracking-tight text-gray-900">{event.title}</h3>
                      <p className="text-sm leading-relaxed text-gray-600">{event.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                        <Compass className="h-4 w-4 text-emerald-700" />
                        <span>
                          {event.latitude.toFixed(3)}, {event.longitude.toFixed(3)}
                        </span>
                      </div>
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
                  <Sparkles className="h-4 w-4" />
                  Langkah Berikutnya
                </p>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                  Punya titik sekolah atau kegiatan yang perlu dipetakan?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                  Kirim laporan sekolah atau hubungi tim STA agar lokasi baru bisa ditindaklanjuti dan dimasukkan ke
                  peta dampak berikutnya.
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
