import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  ZoomIn,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from '../../components/ui/OptimizedImage';
import ImageLightbox from '../../components/ui/ImageLightbox';
import { CampaignPartners } from '../../components/ui/campaign-partners';
import CampaignStatsCard from '../../components/shared/CampaignStatsCard';
import CampaignShareButtons from '../../components/shared/CampaignShareButtons';
import { logError } from '../../lib/error-logger';
import {
  CampaignDonationSummary,
  fetchPublicCampaignDetail,
  getCampaignPrimaryImage,
  getDaysLeft,
} from '../../lib/public-campaigns';
import { Campaign, CampaignUpdateRow } from '../../lib/supabase';
import { calculateProgress, formatCurrency, formatLongDate } from '../../lib/utils';



export default function CampaignDetail() {
  const { slug = '' } = useParams();
  const [activeTab, setActiveTab] = useState<'deskripsi' | 'update' | 'donatur'>('deskripsi');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [updates, setUpdates] = useState<CampaignUpdateRow[]>([]);
  const [donations, setDonations] = useState<CampaignDonationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [updateLightboxImage, setUpdateLightboxImage] = useState<string | null>(null);


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
        logError('CampaignDetail.loadCampaignDetail', loadError, { slug });
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
      <div className="min-h-screen bg-gray-50 px-4 pt-32 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-sm border border-gray-100 bg-white px-6 py-12 text-center text-sm text-gray-400">
          Memuat detail campaign...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-32 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-sm border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Detail campaign belum tersedia</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-32 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-sm border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Campaign tidak ditemukan</h1>
          <p className="mt-2 text-sm text-gray-500">Campaign yang Anda cari belum tersedia atau sudah diarsipkan.</p>
          <Link
            to="/campaigns"
            className="mt-6 inline-flex items-center justify-center rounded-sm border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
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
    <div className="min-h-screen bg-white pb-24 pt-20 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
          <ChevronRight size={10} />
          <Link to="/campaigns" className="hover:text-emerald-600 transition-colors">Campaign</Link>
          <ChevronRight size={10} />
          <span className="truncate text-gray-900">{campaign.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-5 md:space-y-6">

            {/* Header Title Area - More Compact */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {campaign.category_name ?? 'Campaign'}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                {campaign.title}
              </h1>
            </div>

            {/* Premium Image Carousel with Lightbox */}
            <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-gray-50 group/banner border border-gray-100">
              {bannerImages.map((imgUrl, idx) => (
                <OptimizedImage
                  key={idx}
                  src={imgUrl}
                  alt={`${campaign.title} - Foto ${idx + 1}`}
                  containerClassName={`absolute inset-0 transition-opacity duration-500 ${
                    idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  isThumbnail={idx !== 0}
                  onClick={() => setIsLightboxOpen(true)}
                />
              ))}

              {/* Zoom hint overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover/banner:bg-black/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white/0 text-white/0 transition-all duration-300 group-hover/banner:bg-white/80 group-hover/banner:text-gray-700 sm:h-12 sm:w-12">
                  <ZoomIn size={20} />
                </div>
              </div>

              {/* Navigation arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm bg-black/30 text-white transition-colors hover:bg-black/50 sm:left-4 sm:h-10 sm:w-10"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm bg-black/30 text-white transition-colors hover:bg-black/50 sm:right-4 sm:h-10 sm:w-10"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
                  {bannerImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                      className={`h-1 rounded-sm transition-all duration-300 ${
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

            {/* Mobile Stats Card - Compact */}
            <div className="lg:hidden">
              <CampaignStatsCard
                currentAmount={campaign.current_amount}
                targetAmount={campaign.target_amount}
                progress={progress}
                donorCount={campaign.donor_count ?? 0}
                daysLeft={daysLeft}
                slug={campaign.slug}
                variant="compact"
              />
              <div className="rounded-sm border border-x-gray-100 border-b-gray-100 border-t-0 bg-white px-5 pb-5">
                <CampaignShareButtons
                  campaignTitle={campaign.title}
                  keyPrefix="mobile-"
                />
              </div>
            </div>

            {/* Tabs and Content Section - Compact */}
            <div className="rounded-sm border border-gray-100 bg-white overflow-hidden">
              <div className="border-b border-gray-100 px-4 sm:px-6 bg-white sticky top-0 z-10">
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {(['deskripsi', 'update', 'donatur'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative whitespace-nowrap py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab
                          ? 'text-emerald-700'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6 min-h-[300px]">
                {activeTab === 'deskripsi' ? (
                  <div
                    className="prose prose-sm prose-emerald max-w-none text-gray-700 leading-relaxed font-light"
                    dangerouslySetInnerHTML={{ __html: campaign.full_description }}
                  />
                ) : null}

                {activeTab === 'update' ? (
                  updates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 text-sm italic">
                      <p>Belum ada update untuk campaign ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {updates.map((update) => (
                        <div key={update.id} className="relative border-l border-gray-100 pl-6 sm:pl-8">
                          <div className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 bg-emerald-500" />
                          <div className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-tighter text-gray-400">
                            <span>{formatLongDate(update.created_at)}</span>
                            <span>·</span>
                            <span className="text-emerald-600">{update.update_type}</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-2 tracking-tight">{update.title}</h4>
                          <div className="flex flex-col gap-4 mt-2">
                            {update.images && update.images.length > 0 ? (
                              <div className={`grid gap-1 ${update.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                {update.images.map((imgUrl, i) => (
                                  <div
                                    key={i}
                                    className="relative overflow-hidden rounded-sm border border-gray-50 bg-gray-50 cursor-zoom-in group aspect-video"
                                    onClick={() => setUpdateLightboxImage(imgUrl)}
                                  >
                                    <img src={imgUrl} alt={`${update.title} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <div
                              className="prose prose-sm prose-emerald max-w-none text-gray-600 leading-relaxed font-light [&_p]:!my-0"
                              dangerouslySetInnerHTML={{ __html: update.content }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : null}

                {activeTab === 'donatur' ? (
                  donations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 text-sm italic">
                      <p>Belum ada donatur. Jadilah yang pertama!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {donations.map((donation, index) => (
                        <div key={`${donation.created_at}-${index}`} className="flex items-start gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            {donation.donor_name_display.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-gray-900 truncate tracking-tight">{donation.donor_name_display}</h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-bold text-emerald-600">{formatCurrency(donation.amount)}</p>
                              <span className="text-[10px] text-gray-300">|</span>
                              <p className="text-[10px] text-gray-400 font-light">{formatLongDate(donation.created_at)}</p>
                            </div>
                            {donation.message ? (
                              <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-sm border border-gray-100 italic font-light">
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

            {/* Campaign Partners / Collaborators */}
            <CampaignPartners partners={campaign.collaborators} />
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <CampaignStatsCard
                currentAmount={campaign.current_amount}
                targetAmount={campaign.target_amount}
                progress={progress}
                donorCount={campaign.donor_count ?? 0}
                daysLeft={daysLeft}
                slug={campaign.slug}
                variant="full"
              />
              <div className="rounded-sm border border-gray-100 bg-white px-6 pb-6 -mt-4">
                <CampaignShareButtons
                  campaignTitle={campaign.title}
                  keyPrefix="desktop-"
                />
              </div>

              {/* Penggalang Dana - Compact */}
              <div className="flex items-center space-x-4 rounded-sm border border-gray-100 bg-white p-4">
                <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center rounded-sm text-emerald-700 font-bold text-xs">
                  STA
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Penggalang Dana</p>
                  <p className="text-xs font-bold text-gray-900 tracking-tight">Yayasan Sekolah Tanah Air</p>
                  <div className="mt-0.5 inline-flex items-center text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                    <CheckCircle2 size={10} className="mr-1" />
                    Terverifikasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar - Compact */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="safe-pb mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <p className="truncate text-sm font-bold text-gray-900">
                {formatCurrency(campaign.current_amount)}
              </p>
              <p className="text-[10px] text-gray-400 font-bold">{progress}%</p>
            </div>
            <div className="h-1 w-full bg-gray-100 mt-1">
              <div className="h-full bg-emerald-600" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Link
            to={`/donate/${campaign.slug}`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-gray-900 px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-600"
          >
            Donasi
          </Link>
        </div>
      </div>

      {/* Image Lightbox / Popup */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={bannerImages}
        activeIndex={activeSlide}
        onIndexChange={setActiveSlide}
        alt={campaign.title}
      />

      {/* Update Image Lightbox */}
      <ImageLightbox
        isOpen={!!updateLightboxImage}
        onClose={() => setUpdateLightboxImage(null)}
        images={updateLightboxImage ? [updateLightboxImage] : []}
        activeIndex={0}
        onIndexChange={() => {}}
        alt="Timeline Update"
      />
    </div>
  );
}
