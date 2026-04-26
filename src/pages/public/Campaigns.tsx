import { Search } from 'lucide-react';
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
      <div className="border-b border-gray-100 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="mb-3 text-3xl font-black text-gray-900 sm:mb-4 sm:text-4xl">Jelajahi Program Kebaikan</h1>
            <p className="text-base text-gray-500 sm:text-lg">
              Pilih campaign yang ingin Anda dukung dan bantu sekolah, komunitas, atau wilayah yang sedang membutuhkan aksi nyata.
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-40 mb-8 border-b border-gray-100 bg-white/90 py-4 backdrop-blur-md sm:top-20 sm:mb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari campaign..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={
                    activeCategory === category
                      ? 'whitespace-nowrap rounded-full border border-gray-200 bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors'
                      : 'whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50'
                  }
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-5 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
            Memuat campaign...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <Search size={24} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Campaign tidak ditemukan</h3>
            <p className="mt-2 text-sm text-gray-500">
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
