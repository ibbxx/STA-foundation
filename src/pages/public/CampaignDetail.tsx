import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Share2,
  Heart,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  CampaignDonationSummary,
  fetchPublicCampaignDetail,
  getCampaignPrimaryImage,
  getDaysLeft,
} from '../../lib/public-campaigns';
import { Campaign, CampaignUpdateRow } from '../../lib/supabase';
import { calculateProgress, formatCurrency } from '../../lib/utils';

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function CampaignDetail() {
  const { slug = '' } = useParams();
  const [activeTab, setActiveTab] = useState<'deskripsi' | 'update' | 'donatur'>('deskripsi');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [updates, setUpdates] = useState<CampaignUpdateRow[]>([]);
  const [donations, setDonations] = useState<CampaignDonationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadCampaignDetail() {
      setLoading(true);
      setError(null);

      try {
        const detail = await fetchPublicCampaignDetail(slug);
        if (ignore) return;

        setCampaign(detail?.campaign ?? null);
        setUpdates(detail?.updates ?? []);
        setDonations(detail?.donations ?? []);
      } catch (loadError) {
        if (ignore) return;
        setCampaign(null);
        setUpdates([]);
        setDonations([]);
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail campaign.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCampaignDetail();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const progress = useMemo(
    () => calculateProgress(campaign?.current_amount ?? 0, campaign?.target_amount ?? 0),
    [campaign],
  );
  const daysLeft = getDaysLeft(campaign?.end_date ?? campaign?.deadline);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
          Memuat detail campaign...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Detail campaign belum tersedia</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Campaign tidak ditemukan</h1>
          <p className="mt-3 text-sm text-gray-500">Campaign yang Anda cari belum tersedia atau sudah diarsipkan.</p>
          <Link
            to="/campaigns"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Kembali ke daftar campaign
          </Link>
        </div>
      </div>
    );
  }

  const bannerImages = campaign.images && campaign.images.length > 0
    ? campaign.images
    : [campaign.banner_url || getCampaignPrimaryImage({
        id: campaign.id,
        images: campaign.images ?? null,
        image_url: campaign.thumbnail_url,
      })];

  const hasMultipleImages = bannerImages.length > 1;

  function goToSlide(index: number) {
    setActiveSlide(index);
  }

  function prevSlide() {
    setActiveSlide((prev) => (prev === 0 ? bannerImages.length - 1 : prev - 1));
  }

  function nextSlide() {
    setActiveSlide((prev) => (prev === bannerImages.length - 1 ? 0 : prev + 1));
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Link to="/campaigns" className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600 sm:hidden">
          <ArrowLeft size={16} className="mr-2" />
          Kembali ke campaign
        </Link>
        <div className="hidden items-center space-x-2 text-sm text-gray-500 sm:flex">
          <Link to="/" className="hover:text-emerald-600">Beranda</Link>
          <ChevronRight size={14} />
          <Link to="/campaigns" className="hover:text-emerald-600">Campaign</Link>
          <ChevronRight size={14} />
          <span className="truncate font-medium text-gray-900">{campaign.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-8 lg:col-span-7 xl:col-span-8 lg:space-y-12">
            
            {/* Header Title Area */}
            <div className="space-y-4 pt-4 sm:pt-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                  {campaign.category_name ?? 'Campaign'}
                </span>

              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl leading-[1.15]">
                {campaign.title}
              </h1>
            </div>

            {/* Premium Image Carousel - Simplified */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100">
              {bannerImages.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`${campaign.title} - Foto ${idx + 1}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                    idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ))}

              {/* Navigation arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                  {bannerImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeSlide
                          ? 'w-6 bg-white'
                          : 'w-2 bg-white/60 hover:bg-white/90'
                      }`}
                      aria-label={`Foto ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Stats Card - Simplified */}
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 lg:hidden">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-500">Dana Terkumpul</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(campaign.current_amount)}</p>
                    <p className="text-sm font-medium text-gray-500">dari {formatCurrency(campaign.target_amount)}</p>
                  </div>
                </div>
                
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div 
                    className="h-full rounded-full bg-emerald-600" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span>{campaign.donor_count ?? 0} Donatur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <span>{daysLeft === null ? 'Menyusul' : `${daysLeft} Hari Lagi`}</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/donate/${campaign.slug}`}
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-4 text-base font-bold text-white transition-colors hover:bg-emerald-700"
              >
                Donasi Sekarang
              </Link>
            </div>

            {/* Tabs and Content Section - Simplified */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-200 px-4 sm:px-8 bg-white sticky top-0 z-10">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                  {(['deskripsi', 'update', 'donatur'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative whitespace-nowrap py-4 text-sm font-semibold capitalize transition-colors ${
                        activeTab === tab
                          ? 'text-emerald-700'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-8 min-h-[400px]">
                {activeTab === 'deskripsi' ? (
                  <div
                    className="prose prose-emerald max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: campaign.full_description }}
                  />
                ) : null}

                {activeTab === 'update' ? (
                  updates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                      <p>Belum ada update untuk campaign ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {updates.map((update) => (
                        <div key={update.id} className="relative border-l-2 border-gray-100 pl-6 sm:pl-8">
                          <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                            <span>{formatLongDate(update.created_at)}</span>
                            <span>•</span>
                            <span className="font-medium text-emerald-700">{update.update_type}</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-3">{update.title}</h4>
                          <div
                            className="prose prose-sm prose-emerald max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: update.content }}
                          />
                          {update.image_url ? (
                            <img
                              src={update.image_url}
                              alt={update.title}
                              className="mt-4 w-full max-w-lg rounded-xl object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )
                ) : null}

                {activeTab === 'donatur' ? (
                  donations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                      <p>Belum ada donatur. Jadilah yang pertama!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {donations.map((donation, index) => (
                        <div key={`${donation.created_at}-${index}`} className="flex items-start gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            {donation.donor_name_display.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{donation.donor_name_display}</h5>
                            <p className="text-sm font-medium text-emerald-600 mt-0.5">Berdonasi {formatCurrency(donation.amount)}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatLongDate(donation.created_at)}</p>
                            {donation.message ? (
                              <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                "{donation.message}"
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : null}
              </div>
            </div>

            {/* Trust Banner - Simplified */}
            <div className="rounded-2xl bg-emerald-50 px-6 py-6 border border-emerald-100 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-emerald-900">Komitmen Transparansi</h4>
                  <p className="text-sm text-emerald-800 mt-1">
                    100% donasi disalurkan sesuai target. Setiap perkembangan lapangan akan dipublikasikan secara terbuka melalui tab update.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Sidebar Card - Simplified */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 flex flex-col gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500">Dana Terkumpul</p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <p className="text-4xl font-bold text-emerald-600">{formatCurrency(campaign.current_amount)}</p>
                    <p className="text-sm font-medium text-gray-500 mb-1">dari {formatCurrency(campaign.target_amount)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div 
                      className="h-full rounded-full bg-emerald-600" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span>{campaign.donor_count ?? 0} Donatur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span>{daysLeft === null ? 'Menyusul' : `${daysLeft} Hari Lagi`}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <Link
                    to={`/donate/${campaign.slug}`}
                    className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-4 text-base font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    Donasi Sekarang
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        void navigator.clipboard.writeText(window.location.href);
                        alert('Link campaign berhasil disalin!');
                      }
                    }}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 border border-gray-200"
                  >
                    <Share2 size={16} />
                    <span>Bagikan Campaign</span>
                  </button>
                </div>
              </div>

              {/* Penggalang Dana - Simplified */}
              <div className="flex items-center space-x-4 rounded-2xl border border-gray-200 bg-white p-5">

                <div>
                  <p className="text-xs font-semibold text-gray-500">Penggalang Dana</p>
                  <p className="font-bold text-gray-900 mt-0.5">Yayasan Sekolah Tanah Air</p>
                  <div className="mt-1 inline-flex items-center text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={14} className="mr-1" />
                    Terverifikasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar - Simplified */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white lg:hidden">
        <div className="safe-pb mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-500">Terkumpul {progress}%</p>
            <p className="truncate text-sm font-bold text-emerald-600">
              {formatCurrency(campaign.current_amount)}
            </p>
          </div>
          <Link
            to={`/donate/${campaign.slug}`}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            Donasi Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
