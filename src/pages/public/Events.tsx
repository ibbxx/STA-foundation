import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import InteractiveMap from '../../components/shared/InteractiveMap';
import EventCard from '../../components/shared/EventCard';
import VolunteerProgramCard from '../../components/shared/VolunteerProgramCard';
import { Skeleton } from '../../components/ui/skeleton';
import { logError } from '../../lib/error-logger';
import {
  fetchImpactMapLocations,
  fetchPublicVolunteerPrograms,
  type EventMapLocation,
  type VolunteerProgramData,
} from '../../lib/public/events';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

/** Skeleton placeholder untuk EventCard saat loading */
function EventCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden bg-white border border-gray-100 rounded-sm shadow-sm">
      <Skeleton className="aspect-video w-full sm:aspect-[16/10] rounded-none" />
      <div className="flex flex-col flex-1 p-3.5 sm:p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="hidden sm:block space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="mt-auto space-y-3 pt-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="flex justify-end pt-2 border-t border-gray-50">
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const [locations, setLocations] = React.useState<EventMapLocation[]>([]);
  const [volunteerPrograms, setVolunteerPrograms] = React.useState<VolunteerProgramData[]>([]);
  const [selectedLocationId, setSelectedLocationId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeStatus, setActiveStatus] = React.useState('Semua');

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [mapLocations, programs] = await Promise.all([
          fetchImpactMapLocations(),
          fetchPublicVolunteerPrograms(),
        ]);
        if (ignore) return;

        setLocations(mapLocations);
        setVolunteerPrograms(programs);
        setSelectedLocationId(mapLocations[0]?.id ?? null);
      } catch (loadError) {
        logError('Events.loadData', loadError);
        if (ignore) return;

        setLocations([]);
        setVolunteerPrograms([]);
        setSelectedLocationId(null);
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data event.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = React.useMemo(() => {
    const provinceCount = new Set(
      locations.map((location) => location.province ?? location.locationLabel ?? location.title),
    ).size;

    return [
      { label: 'Lokasi Terdokumentasi', value: locations.length },
      { label: 'Wilayah Terpetakan', value: provinceCount },
      { label: 'Sedang Berjalan', value: locations.filter((location) => location.status === 'Berjalan').length },
      { label: 'Program Relawan', value: volunteerPrograms.length },
    ];
  }, [locations, volunteerPrograms]);

  // ── Filtered Volunteer Programs ──
  const filteredVolunteerPrograms = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return volunteerPrograms.filter((prog) => {
      const matchesQuery = !query || [
        prog.title,
        prog.short_description,
        prog.location,
        prog.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

      // Map status tabs ke status program relawan
      let matchesStatus = activeStatus === 'Semua';
      if (activeStatus === 'Berjalan') matchesStatus = prog.status === 'open' || prog.status === 'ongoing';
      if (activeStatus === 'Akan Datang') matchesStatus = prog.status === 'closed' && !!prog.registration_start && new Date(prog.registration_start) > new Date();
      if (activeStatus === 'Selesai') matchesStatus = prog.status === 'closed' && (!prog.registration_start || new Date(prog.registration_start) <= new Date());

      return matchesQuery && matchesStatus;
    });
  }, [searchQuery, activeStatus, volunteerPrograms]);

  // ── Filtered Map Locations ──
  const filteredLocations = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return locations.filter((loc) => {
      const matchesQuery = !query || [
        loc.title,
        loc.description,
        loc.locationLabel,
        loc.province,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesStatus = activeStatus === 'Semua' || loc.status === activeStatus;
      return matchesQuery && matchesStatus;
    });
  }, [searchQuery, activeStatus, locations]);

  // Handle selected location reset if it's filtered out
  React.useEffect(() => {
    if (selectedLocationId && !filteredLocations.find(l => l.id === selectedLocationId)) {
      setSelectedLocationId(filteredLocations[0]?.id ?? null);
    }
  }, [filteredLocations, selectedLocationId]);

  // Program relawan yang sedang buka pendaftaran (highlighted)
  const activeVolunteerPrograms = React.useMemo(() => {
    return filteredVolunteerPrograms.filter(p => p.status === 'open' || p.status === 'ongoing');
  }, [filteredVolunteerPrograms]);

  // Apakah ada data sama sekali (untuk empty state)
  const hasAnyFilteredResults = filteredLocations.length > 0 || filteredVolunteerPrograms.length > 0;
  const hasAnyData = locations.length > 0 || volunteerPrograms.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header Section (Clean, White — Konsisten dengan Campaigns) ── */}
      <div className="border-b border-gray-100 bg-white pt-24 pb-10 sm:pt-32 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="mb-3 text-3xl font-black text-gray-900 sm:mb-4 sm:text-4xl">
              Jelajahi Kegiatan & Aksi
            </h1>
            <p className="text-base text-gray-500 sm:text-lg">
              Saksikan bagaimana setiap dukungan Anda bertransformasi menjadi aksi nyata bagi pendidikan di seluruh pelosok Nusantara.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {!loading && hasAnyData && (
        <section className="border-b border-gray-100 bg-white/90 py-3 backdrop-blur-md sm:py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      )}

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-16 z-40 border-b border-gray-100 bg-white/90 py-6 backdrop-blur-md sm:top-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-xs group">
              <Search
                className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari event, program, atau lokasi..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent py-2 pl-7 pr-4 text-sm text-gray-900 outline-none border-b border-gray-200 focus:border-emerald-600 transition-all duration-300 placeholder:text-gray-400 font-light"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              {['Semua', 'Berjalan', 'Akan Datang', 'Selesai'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className="relative py-2 text-sm font-bold tracking-tight whitespace-nowrap transition-colors"
                >
                  <span className={activeStatus === status ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}>
                    {status}
                  </span>
                  {activeStatus === status && (
                    <motion.div
                      layoutId="statusUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Program Relawan Aktif ── */}
      {!loading && activeVolunteerPrograms.length > 0 && (
        <section className="py-10 sm:py-14 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mb-8">
              <p className="mb-3 inline-flex items-center gap-2 rounded-sm bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Sedang Buka Pendaftaran</span>
              </p>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                Program Relawan Aktif
              </h2>
              <p className="mt-2 text-sm text-gray-500 sm:text-base font-light max-w-2xl">
                Bergabunglah sebagai relawan di program-program berikut yang sedang membuka pendaftaran.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 xl:gap-8">
              {activeVolunteerPrograms.map((program) => (
                <VolunteerProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 2: Peta Interaktif ── */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-0 sm:px-6 lg:px-8">
          {error ? (
            <div className="mx-5 rounded-sm border border-red-100 bg-white px-6 py-8 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden sm:rounded-[2.5rem] bg-gray-900 shadow-2xl"
            >
              <InteractiveMap
                locations={filteredLocations}
                className="w-full h-[65vh] sm:h-[70vh] min-h-[450px] sm:min-h-[600px]"
                scrollWheelZoom={true}
                useFallbackLocations={false}
                viewportMode="fit-indonesia"
                emptyTitle={loading ? 'Memuat data event...' : 'Tidak ada titik event yang sesuai dengan filter'}
                emptyDescription={
                  loading
                    ? 'Peta akan otomatis terisi setelah data berhasil dimuat.'
                    : 'Coba ubah kata kunci pencarian atau tab status di atas.'
                }
                onLocationSelect={(location) => setSelectedLocationId(location.id)}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Section 3: Daftar Jurnal Perjalanan (EventCard dari Impact Map) ── */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 xl:gap-8">
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : error ? (
            <div className="rounded-sm border border-gray-200 bg-white px-6 py-8 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          ) : !hasAnyData ? (
            <div className="rounded-sm border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-sm bg-gray-50">
                <Compass size={20} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Belum ada event yang siap ditampilkan</h3>
              <p className="mt-2 text-sm text-gray-400 font-light">
                Setelah data impact map dipublikasikan, daftar lokasi kegiatan akan muncul di sini.
              </p>
            </div>
          ) : !hasAnyFilteredResults ? (
            <div className="rounded-sm border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-sm bg-gray-50">
                <Search size={20} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Event tidak ditemukan</h3>
              <p className="mt-2 text-sm text-gray-400 font-light">
                Tidak ada event yang sesuai dengan pencarian "{searchQuery}" atau status "{activeStatus}".<br />
                Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
              </p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="rounded-sm border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-gray-400 font-light">
                Tidak ada lokasi di peta yang cocok dengan filter saat ini.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 xl:gap-8">
              {filteredLocations.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedLocationId === event.id}
                  onSelect={(e) => setSelectedLocationId(e.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
