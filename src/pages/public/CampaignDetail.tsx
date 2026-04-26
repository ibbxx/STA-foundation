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
  ZoomIn,
} from 'lucide-react';
import OptimizedImage from '../../components/ui/OptimizedImage';
import ImageLightbox from '../../components/ui/ImageLightbox';
import { CampaignPartners } from '../../components/ui/campaign-partners';
import { logError } from '../../lib/error-logger';
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

            {/* Premium Image Carousel with Lightbox */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-100 group/banner">
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
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover/banner:bg-black/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/0 text-white/0 transition-all duration-300 group-hover/banner:bg-white/80 group-hover/banner:text-gray-700 sm:h-12 sm:w-12">
                  <ZoomIn size={20} />
                </div>
              </div>

              {/* Navigation arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:left-4 sm:h-10 sm:w-10"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft size={18} className="sm:hidden" />
                    <ChevronLeft size={20} className="hidden sm:block" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:right-4 sm:h-10 sm:w-10"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight size={18} className="sm:hidden" />
                    <ChevronRight size={20} className="hidden sm:block" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {hasMultipleImages && (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4 sm:gap-2">
                  {bannerImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                      className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${
                        idx === activeSlide
                          ? 'w-5 bg-white sm:w-6'
                          : 'w-1.5 bg-white/60 hover:bg-white/90 sm:w-2'
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
              <div className="flex flex-col gap-3">
                <Link
                  to={`/donate/${campaign.slug}`}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-4 text-base font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  Donasi Sekarang
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        void navigator.clipboard.writeText(window.location.href);
                        alert('Link campaign berhasil disalin!');
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Share2 size={16} />
                    <span>Salin Link</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Halo! Mari bersama bantu: ${campaign.title}. Donasi sekarang di: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.412 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.488l-6.246 1.7zm6.599-3.858c1.63 1.046 3.423 1.6 5.284 1.6 5.503 0 9.981-4.478 9.981-9.981 0-2.664-1.037-5.166-2.922-7.054-1.884-1.884-4.384-2.919-7.059-2.919-5.503 0-9.981 4.478-9.981 9.981 0 1.932.553 3.816 1.597 5.449l-.995 3.636 3.73-.974zm11.233-5.344c-.313-.157-1.854-.913-2.145-1.018-.291-.106-.503-.157-.715.157-.212.313-.82 1.018-1.006 1.23-.186.212-.371.238-.684.081-.313-.157-1.32-.486-2.515-1.552-.93-.829-1.558-1.854-1.74-2.169-.186-.313-.02-.481.137-.637.141-.14.313-.371.469-.557.157-.186.212-.313.313-.53.106-.212.053-.4-.026-.557-.079-.157-.715-1.722-.98-2.357-.258-.632-.52-.547-.715-.557-.186-.01-.397-.01-.609-.01s-.557.079-.847.4c-.291.313-1.111 1.087-1.111 2.651s1.138 3.076 1.297 3.288c.159.212 2.24 3.42 5.423 4.793.757.327 1.35.52 1.812.667.76.241 1.45.207 1.996.126.609-.09 1.854-.758 2.118-1.45.265-.692.265-1.284.186-1.408-.079-.124-.291-.212-.604-.369z"/>
                    </svg>
                    <span>Bagikan ke WA</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Tabs and Content Section - Simplified */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-200 px-4 sm:px-8 bg-white sticky top-0 z-10">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                  {(['deskripsi', 'update', 'donatur'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative whitespace-nowrap py-4 text-sm font-semibold capitalize transition-colors ${activeTab === tab
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
                    <div className="space-y-6">
                      {updates.map((update) => (
                        <div key={update.id} className="relative border-l-2 border-gray-100 pl-6 sm:pl-8">
                          <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                          <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                            <span>{formatLongDate(update.created_at)}</span>
                            <span>·</span>
                            <span className="font-medium text-emerald-600">{update.update_type}</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1.5">{update.title}</h4>
                          <div className="flex flex-col gap-4 mt-2">
                            {update.images && update.images.length > 0 ? (
                              <div className={`grid gap-2 ${update.images.length === 1 ? 'grid-cols-1' : update.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                {update.images.map((imgUrl, i) => (
                                  <div
                                    key={i}
                                    className={`relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 cursor-zoom-in group ${update.images!.length === 3 && i === 0 ? 'col-span-2 sm:col-span-1' : ''} ${update.images!.length === 1 ? 'aspect-video' : 'aspect-square sm:aspect-video'}`}
                                    onClick={() => setUpdateLightboxImage(imgUrl)}
                                    title="Klik untuk memperbesar"
                                  >
                                    <img src={imgUrl} alt={`${update.title} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                                  </div>
                                ))}
                              </div>
                            ) : update.image_url ? (
                              <div 
                                className="relative w-full aspect-video overflow-hidden rounded-xl border border-gray-100 bg-gray-50 cursor-zoom-in group"
                                onClick={() => setUpdateLightboxImage(update.image_url!)}
                                title="Klik untuk memperbesar"
                              >
                                <img
                                  src={update.image_url}
                                  alt={update.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              </div>
                            ) : null}
                            <div
                              className="prose prose-sm prose-emerald max-w-none text-gray-700 leading-relaxed [&_img]:hidden [&_p]:!my-0 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-2"
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

            {/* Campaign Partners / Collaborators */}
            <CampaignPartners partners={campaign.collaborators} />
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
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          void navigator.clipboard.writeText(window.location.href);
                          alert('Link campaign berhasil disalin!');
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Share2 size={16} />
                      <span>Salin Link</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Halo! Mari bersama bantu: ${campaign.title}. Donasi sekarang di: ${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.412 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.488l-6.246 1.7zm6.599-3.858c1.63 1.046 3.423 1.6 5.284 1.6 5.503 0 9.981-4.478 9.981-9.981 0-2.664-1.037-5.166-2.922-7.054-1.884-1.884-4.384-2.919-7.059-2.919-5.503 0-9.981 4.478-9.981 9.981 0 1.932.553 3.816 1.597 5.449l-.995 3.636 3.73-.974zm11.233-5.344c-.313-.157-1.854-.913-2.145-1.018-.291-.106-.503-.157-.715.157-.212.313-.82 1.018-1.006 1.23-.186.212-.371.238-.684.081-.313-.157-1.32-.486-2.515-1.552-.93-.829-1.558-1.854-1.74-2.169-.186-.313-.02-.481.137-.637.141-.14.313-.371.469-.557.157-.186.212-.313.313-.53.106-.212.053-.4-.026-.557-.079-.157-.715-1.722-.98-2.357-.258-.632-.52-.547-.715-.557-.186-.01-.397-.01-.609-.01s-.557.079-.847.4c-.291.313-1.111 1.087-1.111 2.651s1.138 3.076 1.297 3.288c.159.212 2.24 3.42 5.423 4.793.757.327 1.35.52 1.812.667.76.241 1.45.207 1.996.126.609-.09 1.854-.758 2.118-1.45.265-.692.265-1.284.186-1.408-.079-.124-.291-.212-.604-.369z"/>
                    </svg>
                    <span>Share WA</span>
                    </a>
                  </div>
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
