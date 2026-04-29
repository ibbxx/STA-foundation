import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import CampaignCard from '../../components/shared/CampaignCard';
import { logError } from '../../lib/error-logger';
import { fetchPublicCampaigns } from '../../lib/public-campaigns';
import { Campaign } from '../../lib/supabase';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadCampaigns() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPublicCampaigns();
        if (ignore) return;

        setCampaigns(result.campaigns);
      } catch (loadError) {
        logError('Campaigns.loadCampaigns', loadError);
        if (ignore) return;
        setCampaigns([]);
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat campaign.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCampaigns();

    return () => {
      ignore = true;
    };
  }, []);

  // Hanya tampilkan kategori yang memiliki campaign aktif
  const categoryOptions = useMemo(() => {
    const uniqueCategories = [...new Set(
      campaigns
        .map((c) => c.category_name)
        .filter((name): name is string => !!name)
    )];
    return ['Semua', ...uniqueCategories.sort()];
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesQuery = !query || [
        campaign.title,
        campaign.short_description,
        campaign.category_name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesCategory = activeCategory === 'Semua' || campaign.category_name === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, campaigns, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="border-b border-gray-100 bg-white pt-24 pb-10 sm:pt-32 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="mb-3 text-3xl font-black text-gray-900 sm:mb-4 sm:text-4xl">Jelajahi Program Kebaikan</h1>
            <p className="text-base text-gray-500 sm:text-lg">
              Pilih campaign yang ingin Anda dukung dan bantu sekolah, komunitas, atau wilayah yang sedang membutuhkan aksi nyata.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-40 mb-12 border-b border-gray-100 bg-white/90 py-6 backdrop-blur-md sm:top-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* ── Search Bar (Clean & Animated) ── */}
            <div className="relative w-full md:max-w-xs group">
              <Search 
                className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" 
                size={18} 
              />
              <input
                type="text"
                placeholder="Cari campaign..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent py-2 pl-7 pr-4 text-sm text-gray-900 outline-none border-b border-gray-200 focus:border-emerald-600 transition-all duration-300 placeholder:text-gray-400 font-light"
              />
            </div>

            {/* ── Categories (Editorial Style) ── */}
            <div className="flex items-center gap-6 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className="relative py-2 text-sm font-bold tracking-tight whitespace-nowrap transition-colors"
                >
                  <span className={activeCategory === category ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}>
                    {category}
                  </span>
                  {activeCategory === category && (
                    <motion.div 
                      layoutId="categoryUnderline"
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-none border border-gray-200 bg-white px-6 py-5 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-none border border-gray-100 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Memuat campaign...
            </motion.div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="rounded-sm border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-sm bg-gray-50">
              <Search size={20} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Campaign tidak ditemukan</h3>
            <p className="mt-2 text-sm text-gray-400 font-light">
              Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 xl:gap-8">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
