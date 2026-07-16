import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Heart,
  ArrowLeft,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Building2,
  Upload,
  X,
} from 'lucide-react';
import { SecureTurnstile } from '../../components/shared/SecureTurnstile';
import { getEdgeFunctionErrorMessage } from '../../lib/admin/repository';
import { logError } from '../../lib/error-logger';
import { fetchPublicCampaignForDonate } from '../../lib/public-campaigns';
import { Campaign, parseSiteContentValue, supabase } from '../../lib/supabase';
import { formatCurrency, cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/skeleton';
import { stripHtmlToText, truncateText, useSeo } from '../../lib/seo';
import { compressImage } from '../../lib/image-compression';
import {
  DEFAULT_PAYMENT_SETTINGS,
  PAYMENT_SETTINGS_KEY,
  getVisibleManualPaymentMethods,
  normalizePaymentSettings,
  type ManualPaymentMethod,
  type PaymentSettings,
} from '../../lib/payment-settings';

const donationSchema = z.object({
  amount: z.number().min(10000, 'Minimal donasi Rp 10.000'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp tidak valid'),
  message: z.string().optional(),
  isAnonymous: z.boolean(),
  paymentMethod: z.string().min(1, 'Pilih metode pembayaran'),
});

type DonationFormValues = z.infer<typeof donationSchema>;

const QUICK_AMOUNTS = [20000, 40000, 75000, 100000, 300000, 500000, 1000000];

const PAYMENT_METHOD_ICONS: Record<ManualPaymentMethod, typeof QrCode> = {
  qris: QrCode,
  bank_transfer: Building2,
};

async function compressPaymentProof(file: File): Promise<File> {
  const normalized = await compressImage(file);
  if (!normalized.type.startsWith('image/')) return normalized;

  try {
    const imageCompression = (await import('browser-image-compression')).default;
    const compressed = await imageCompression(normalized, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/webp',
    });

    return new File(
      [compressed],
      normalized.name.replace(/\.[^.]+$/, '') + '.webp',
      { type: 'image/webp', lastModified: Date.now() },
    );
  } catch (err) {
    logError('Donate.compressPaymentProof', err, {
      fileType: normalized.type,
      fileSize: normalized.size,
    });
    return normalized;
  }
}

function DonateSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-40 md:pb-24 animate-pulse">
      {/* Header Spacer */}
      <div className="border-b border-gray-100 bg-white pt-24 pb-8 sm:pt-32 sm:pb-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-36 mb-6" />
          <div className="flex items-start space-x-4 sm:items-center">
            <Skeleton className="h-14 w-14 rounded-2xl sm:h-16 sm:w-16" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48 sm:h-8" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl px-4 sm:mt-10 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Nominal Section */}
        <div className="space-y-5 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-lg sm:rounded-[2rem] sm:p-8">
          <div className="flex items-center space-x-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[...Array(7)].map((_, i) => (
              <li key={i}>
                <Skeleton className="h-14 rounded-2xl" />
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>

        {/* Form Info Section */}
        <div className="space-y-5 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-lg sm:rounded-[2rem] sm:p-8">
          <div className="flex items-center space-x-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Donate() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const seoDescription = campaign
    ? truncateText(stripHtmlToText(campaign.full_description) || `Donasi untuk campaign ${campaign.title} bersama Sekolah Tanah Air.`)
    : 'Form donasi campaign Sekolah Tanah Air.';

  useSeo({
    title: campaign ? `Donasi ${campaign.title}` : 'Donasi Campaign',
    description: seoDescription,
    path: `/donate/${slug}`,
    image: campaign?.thumbnail_url,
    robots: 'noindex,follow',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 20000,
      isAnonymous: false,
      paymentMethod: '',
      name: '',
      email: '',
      whatsapp: '',
      message: '',
    },
  });

  const selectedAmount = watch('amount');
  const selectedPayment = watch('paymentMethod');
  const visibleManualPaymentMethods = getVisibleManualPaymentMethods(paymentSettings);
  const selectedManualMethod = visibleManualPaymentMethods.find((method) => method.id === selectedPayment);
  const manualPaymentUnavailable = !paymentSettings.manual_enabled || visibleManualPaymentMethods.length === 0;
  const formId = 'donation-form';

  useEffect(() => {
    let ignore = false;

    async function loadCampaign() {
      setLoadingCampaign(true);
      setPageError(null);

      try {
        const nextCampaign = await fetchPublicCampaignForDonate(slug);
        if (ignore) return;

        setCampaign(nextCampaign);
        if (!nextCampaign) {
          logError('Donate.loadCampaign.notFound', new Error('Campaign tidak ditemukan.'), { slug });
          setPageError('Campaign tidak ditemukan.');
        }
      } catch (loadError) {
        logError('Donate.loadCampaign', loadError, { slug });
        if (ignore) return;
        setCampaign(null);
        setPageError(loadError instanceof Error ? loadError.message : 'Gagal memuat campaign.');
      } finally {
        if (!ignore) {
          setLoadingCampaign(false);
        }
      }
    }

    loadCampaign();

    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    let ignore = false;

    async function loadPaymentSettings() {
      setLoadingPaymentSettings(true);
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('value')
          .eq('key', PAYMENT_SETTINGS_KEY)
          .maybeSingle();

        if (error) throw error;
        if (ignore) return;

        const parsed = parseSiteContentValue<PaymentSettings>(data?.value);
        setPaymentSettings(normalizePaymentSettings(parsed));
      } catch (settingsError) {
        logError('Donate.loadPaymentSettings', settingsError);
        if (!ignore) setPaymentSettings(DEFAULT_PAYMENT_SETTINGS);
      } finally {
        if (!ignore) setLoadingPaymentSettings(false);
      }
    }

    loadPaymentSettings();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (selectedPayment && !visibleManualPaymentMethods.some((method) => method.id === selectedPayment)) {
      setValue('paymentMethod', '');
      setPaymentProof(null);
    }
  }, [selectedPayment, setValue, visibleManualPaymentMethods]);

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPageError('Bukti pembayaran harus berupa gambar.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPageError('Ukuran gambar maksimal 10MB sebelum dikompres.');
      event.target.value = '';
      return;
    }

    setPaymentProof(file);
    setPageError(null);
  };

  const onSubmit = async (data: DonationFormValues) => {
    if (!campaign) return;
    if (!turnstileToken) {
      setPageError('Mohon selesaikan verifikasi keamanan.');
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    if (manualPaymentUnavailable || !selectedManualMethod) {
      setPageError('Metode pembayaran belum tersedia.');
      setIsSubmitting(false);
      return;
    }

    if (!paymentProof) {
      setPageError('Mohon unggah bukti pembayaran.');
      setIsSubmitting(false);
      return;
    }

    const processedProof = await compressPaymentProof(paymentProof);
    const payload = {
      turnstile_token: turnstileToken,
      campaign_id: campaign.id,
      donor_name: data.name.trim(),
      donor_email: data.email.trim(),
      donor_phone: data.whatsapp.trim(),
      amount: data.amount,
      payment_method: data.paymentMethod,
      message: data.message?.trim() || '',
      is_anonymous: data.isAnonymous,
    };

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    formData.append('payment_proof', processedProof);

    const { data: insertedDonation, error } = await supabase.functions.invoke<{ id: string }>('create-pending-donation', {
      body: formData,
    });

    if (error) {
      logError('Donate.submitDonation', error, {
        campaignId: campaign.id,
        paymentMethod: data.paymentMethod,
      });
      setPageError(await getEdgeFunctionErrorMessage(error, 'Donasi gagal dibuat.'));
      setIsSubmitting(false);
      return;
    }

    navigate('/payment/success', {
      state: {
        amount: data.amount,
        paymentMethod: selectedManualMethod.name,
        transactionId: insertedDonation?.id,
      },
    });
  };

  if (loadingCampaign || loadingPaymentSettings) {
    return <DonateSkeleton />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Campaign tidak ditemukan</h1>
          <p className="mt-3 text-sm text-gray-500">{pageError ?? 'Campaign yang Anda cari belum tersedia.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 md:pb-24">
      <div className="border-b border-gray-100 bg-white pt-24 pb-8 sm:pt-32 sm:pb-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-sm font-bold text-gray-500 transition-colors hover:text-emerald-600"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali ke Campaign
          </button>
          <div className="flex items-start space-x-4 sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 sm:h-16 sm:w-16">
              <Heart className="h-8 w-8 fill-current text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-gray-900 sm:text-[2rem]">Donasi Sekarang</h1>
              <p className="mt-1 text-sm font-medium text-gray-500">{campaign.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl px-4 sm:mt-10 sm:px-6 lg:px-8">
        {pageError ? (
          <div className="mb-6 rounded-[1.5rem] border border-gray-200 bg-white px-5 py-4 text-sm text-red-600 shadow-sm">
            {pageError}
          </div>
        ) : null}

        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
          <div className="space-y-5 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-lg shadow-emerald-100/30 sm:rounded-[2rem] sm:p-8">
            <div className="mb-2 flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Banknote size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Pilih Nominal Donasi</h2>
            </div>

            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {QUICK_AMOUNTS.map((amount) => (
                <li key={amount}>
                  <button
                    type="button"
                    onClick={() => setValue('amount', amount)}
                    className={cn(
                      'w-full min-h-14 rounded-2xl border-2 px-3 py-4 text-sm font-bold transition-all',
                      selectedAmount === amount
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                        : 'border-gray-100 text-gray-600 hover:border-emerald-200',
                    )}
                  >
                    {formatCurrency(amount)}
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nominal Lainnya</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 text-lg font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="0"
                />
              </div>
              {errors.amount ? <p className="text-xs font-bold text-red-500">{errors.amount.message}</p> : null}
            </div>
          </div>

          <div className="space-y-5 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-lg shadow-emerald-100/30 sm:rounded-[2rem] sm:p-8">
            <div className="mb-2 flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Informasi Donatur</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nama Lengkap</label>
                <input
                  {...register('name')}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Masukkan nama Anda"
                />
                {errors.name ? <p className="text-xs font-bold text-red-500">{errors.name.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="email@anda.com"
                />
                {errors.email ? <p className="text-xs font-bold text-red-500">{errors.email.message}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nomor WhatsApp</label>
              <input
                {...register('whatsapp')}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="0812xxxxxxx"
              />
              {errors.whatsapp ? <p className="text-xs font-bold text-red-500">{errors.whatsapp.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Pesan atau doa</label>
              <textarea
                {...register('message')}
                rows={3}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Tulis doa atau pesan dukungan Anda..."
              />
            </div>

            <div className="flex items-center space-x-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <input
                type="checkbox"
                id="isAnonymous"
                {...register('isAnonymous')}
                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isAnonymous" className="cursor-pointer text-sm font-bold text-gray-600">
                Sembunyikan nama saya (Donasi Anonim)
              </label>
            </div>
          </div>

          <div className="space-y-5 rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-lg shadow-emerald-100/30 sm:rounded-[2rem] sm:p-8">
            <input type="hidden" {...register('paymentMethod')} />
            <div className="mb-2 flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Metode Pembayaran</h2>
            </div>

            {manualPaymentUnavailable ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-5 text-sm font-medium text-amber-800">
                Metode pembayaran manual sedang tidak tersedia. Silakan coba kembali nanti.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleManualPaymentMethods.map((method) => {
                    const Icon = PAYMENT_METHOD_ICONS[method.id];
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setValue('paymentMethod', method.id, { shouldDirty: true, shouldValidate: true });
                          setPaymentProof(null);
                        }}
                        className={cn(
                          'w-full rounded-2xl border-2 p-4 text-left transition-all sm:p-5',
                          selectedPayment === method.id
                            ? 'border-emerald-500 bg-emerald-50 shadow-md'
                            : 'border-gray-100 hover:border-emerald-100',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 sm:items-center">
                          <div className="flex min-w-0 items-start space-x-3 sm:items-center sm:space-x-4">
                            <div
                              className={cn(
                                'shrink-0 rounded-xl p-2',
                                selectedPayment === method.id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400',
                              )}
                            >
                              <Icon size={20} />
                            </div>
                            <div>
                              <span
                                className={cn(
                                  'block text-sm font-bold leading-relaxed',
                                  selectedPayment === method.id ? 'text-emerald-700' : 'text-gray-600',
                                )}
                              >
                                {method.name}
                              </span>
                              <span className="mt-1 block text-xs font-medium leading-relaxed text-gray-400">
                                {method.description}
                              </span>
                            </div>
                          </div>
                          {selectedPayment === method.id ? (
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 sm:mt-0">
                              <CheckCircle2 size={14} className="text-white" />
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedPayment === 'qris' && paymentSettings.qris_image_url ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-700">Scan QRIS</p>
                    <a href={paymentSettings.qris_image_url} target="_blank" rel="noopener noreferrer" className="mx-auto block max-w-xs overflow-hidden rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
                      <img src={paymentSettings.qris_image_url} alt="QRIS Donasi Sekolah Tanah Air" className="w-full rounded-xl" />
                    </a>
                  </div>
                ) : null}

                {selectedPayment === 'bank_transfer' && paymentSettings.bank_accounts.length > 0 ? (
                  <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Rekening Transfer</p>
                    {paymentSettings.bank_accounts.map((account) => (
                      <div key={account.id} className="rounded-xl border border-emerald-100 bg-white p-4">
                        <p className="text-sm font-black text-gray-900">{account.bank_name}</p>
                        <p className="mt-1 font-mono text-lg font-black text-emerald-700">{account.account_number}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">a.n. {account.account_name}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedManualMethod ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                      {paymentSettings.manual_instructions}
                    </div>
                    {paymentProof ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <Upload size={18} className="shrink-0 text-emerald-600" />
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-emerald-800">{paymentProof.name}</span>
                        <button
                          type="button"
                          onClick={() => setPaymentProof(null)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 hover:bg-emerald-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50">
                        <Upload size={18} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">Unggah bukti pembayaran</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                      </label>
                    )}
                  </div>
                ) : null}
              </>
            )}
            {errors.paymentMethod ? <p className="text-xs font-bold text-red-500">{errors.paymentMethod.message}</p> : null}

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Verifikasi Keamanan</p>
              <SecureTurnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setPageError(null);
                }}
                onError={() => {
                  setTurnstileToken(null);
                }}
              />
            </div>
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Campaign aktif</p>
            <p className="truncate text-sm font-bold text-gray-900">{campaign.title}</p>
          </div>
          <button
            form={formId}
            type="submit"
            disabled={isSubmitting || manualPaymentUnavailable}
            className="inline-flex min-h-12 min-w-[160px] items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : manualPaymentUnavailable ? 'Belum Tersedia' : `Donasi ${formatCurrency(selectedAmount || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
