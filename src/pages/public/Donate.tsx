import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  RefreshCw,
  Download,
  Loader2,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { SecureTurnstile } from '../../components/shared/SecureTurnstile';
import { getEdgeFunctionErrorMessage } from '../../lib/admin/repository';
import { logError } from '../../lib/error-logger';
import { fetchPublicCampaignForDonate } from '../../lib/public-campaigns';
import { Campaign, parseSiteContentValue, supabase } from '../../lib/supabase';
import { formatCurrency, cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/skeleton';
import VAlert7 from '../../components/ui/v-alert-7';
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
import {
  type QrisDynamicData,
  generateQrisDataUrl,
  downloadQrisImage,
  getRemainingSeconds,
  formatCountdown,
} from '../../lib/qris';

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



function DonateSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-40 md:pb-24 animate-pulse">
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
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  // --- QRIS Dynamic state ---
  const [qrisData, setQrisData] = useState<QrisDynamicData | null>(null);
  const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisCountdown, setQrisCountdown] = useState(0);
  const [qrisProof, setQrisProof] = useState<File | null>(null);
  const [qrisProofPreview, setQrisProofPreview] = useState<string | null>(null);
  const [qrisSubmitting, setQrisSubmitting] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    getValues,
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
  const hasQrisRawString = Boolean(paymentSettings.qris_raw_string.trim());
  const isQrisDynamic = selectedPayment === 'qris' && hasQrisRawString;

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
      resetQrisState();
    }
  }, [selectedPayment, setValue, visibleManualPaymentMethods]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const resetQrisState = useCallback(() => {
    setQrisData(null);
    setQrisImageUrl('');
    setQrisLoading(false);
    setQrisCountdown(0);
    setQrisProof(null);
    setQrisProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  function startCountdown(expiresAt: string) {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setQrisCountdown(getRemainingSeconds(expiresAt));

    countdownRef.current = setInterval(() => {
      const remaining = getRemainingSeconds(expiresAt);
      setQrisCountdown(remaining);
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 1000);
  }

  async function handleGenerateQris() {
    if (!campaign || !turnstileToken) {
      setPageError(!turnstileToken ? 'Mohon selesaikan verifikasi keamanan.' : 'Campaign tidak ditemukan.');
      return;
    }

    const values = getValues();

    if (!values.name || values.name.trim().length < 2) {
      setPageError('Nama minimal 2 karakter.');
      return;
    }
    if (!values.email || !values.email.includes('@')) {
      setPageError('Email tidak valid.');
      return;
    }
    if (!values.whatsapp || values.whatsapp.trim().length < 10) {
      setPageError('Nomor WhatsApp tidak valid.');
      return;
    }
    if (!values.amount || values.amount < 10000) {
      setPageError('Minimal donasi Rp 10.000.');
      return;
    }

    setQrisLoading(true);
    setPageError(null);
    resetQrisState();

    try {
      const payload = {
        turnstile_token: turnstileToken || '1x00000000000000000000AA',
        campaign_id: campaign.id,
        amount: values.amount,
        donor_name: values.name.trim(),
        donor_email: values.email.trim(),
        donor_phone: values.whatsapp.trim(),
        message: values.message?.trim() || '',
        is_anonymous: values.isAnonymous,
      };

      const { data, error } = await supabase.functions.invoke<QrisDynamicData>('generate-qris-dynamic', {
        body: payload,
      });

      if (error) {
        logError('Donate.generateQris', error, { campaignId: campaign.id });
        setPageError(await getEdgeFunctionErrorMessage(error, 'Gagal membuat kode QRIS.'));
        setQrisLoading(false);
        return;
      }

      if (!data?.qris_string) {
        setPageError('Gagal membuat kode QRIS. Silakan coba lagi.');
        setQrisLoading(false);
        return;
      }

      setQrisData(data);
      const dataUrl = await generateQrisDataUrl(data.qris_string);
      setQrisImageUrl(dataUrl);
      startCountdown(data.expires_at);

      // Auto scroll ke atas agar QR Code langsung terlihat
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (err) {
      logError('Donate.generateQris.catch', err);
      setPageError(err instanceof Error ? err.message : 'Gagal membuat kode QRIS.');
    } finally {
      setQrisLoading(false);
    }
  }

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
    setPaymentProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPageError(null);
  };

  const onSubmit = async (data: DonationFormValues) => {
    if (!campaign) return;
    if (!turnstileToken) {
      setPageError('Mohon selesaikan verifikasi keamanan.');
      return;
    }

    if (isQrisDynamic) {
      await handleGenerateQris();
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

    const processedProof = await compressImage(paymentProof, {
      maxWidth: 1200,
      maxSizeBytes: 200 * 1024,
      quality: 0.75,
    });
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

  const handleQrisProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPageError('Bukti pembayaran harus berupa gambar.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPageError('Ukuran gambar maksimal 10MB.');
      event.target.value = '';
      return;
    }

    setQrisProof(file);
    setQrisProofPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPageError(null);
  };

  async function handleQrisPaid() {
    if (!qrisData) return;

    if (!qrisProof) {
      setPageError('Mohon unggah screenshot bukti pembayaran terlebih dahulu sebelum konfirmasi.');
      requestAnimationFrame(() => {
        const uploadArea = document.getElementById('qris-proof-upload-area');
        if (uploadArea) {
          uploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }

    setQrisSubmitting(true);
    setPageError(null);

    try {
      const processedProof = await compressImage(qrisProof, {
        maxWidth: 1200,
        maxSizeBytes: 200 * 1024,
        quality: 0.75,
      });
      const proofPath = `qris/${qrisData.donation_id}/${processedProof.name}`;

      const { error: uploadError } = await supabase.storage
        .from('donation-proofs')
        .upload(proofPath, processedProof, { upsert: true });

      if (uploadError) {
        logError('Donate.handleQrisPaid.uploadProof', uploadError);
        setPageError('Gagal mengunggah bukti pembayaran. Silakan coba lagi.');
        setQrisSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('donations')
        .update({ payment_proof_path: proofPath })
        .eq('id', qrisData.donation_id);

      if (updateError) {
        logError('Donate.handleQrisPaid.updateDonation', updateError);
        setPageError('Gagal menyelaraskan data bukti pembayaran. Silakan coba lagi.');
        setQrisSubmitting(false);
        return;
      }

      setQrisSubmitting(false);
      navigate('/payment/success', {
        state: {
          amount: selectedAmount,
          paymentMethod: 'QRIS',
          transactionId: qrisData.donation_id,
          finalAmount: qrisData.final_amount,
        },
      });
    } catch (err) {
      logError('Donate.handleQrisPaid.catch', err);
      setPageError(err instanceof Error ? err.message : 'Gagal memproses konfirmasi pembayaran.');
      setQrisSubmitting(false);
    }
  }

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

  // --- Tampilan Kode QRIS Setelah Diklik ---
  if (qrisData && qrisImageUrl) {
    const isExpired = qrisCountdown <= 0;

    return (
      <div className="min-h-screen bg-gray-50 pb-40 md:pb-24">
        <div className="border-b border-gray-100 bg-white pt-24 pb-8 sm:pt-32 sm:pb-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => resetQrisState()}
              className="mb-6 flex items-center text-sm font-bold text-gray-500 transition-colors hover:text-emerald-600"
            >
              <ArrowLeft size={18} className="mr-2" />
              Kembali ke Form
            </button>
            <div className="flex items-start space-x-4 sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 sm:h-16 sm:w-16">
                <QrCode className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-gray-900 sm:text-[2rem]">Scan Kode QRIS</h1>
                <p className="mt-1 text-sm font-medium text-gray-500">{campaign.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        <AnimatePresence>
          {pageError && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 inset-x-4 mx-auto max-w-lg z-[100]"
            >
              <VAlert7
                title="Perhatian"
                message={pageError}
                onClose={() => setPageError(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto mt-6 max-w-3xl px-4 sm:mt-10 sm:px-6 lg:px-8 space-y-6">

          <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-lg shadow-emerald-100/30 sm:rounded-[2rem] sm:p-8">
            <div className="flex flex-col items-center">
              <div className={cn(
                'relative mx-auto overflow-hidden rounded-2xl border-2 bg-white p-3 shadow-sm transition-opacity',
                isExpired ? 'border-gray-200 opacity-40' : 'border-emerald-100',
              )}>
                <img
                  src={qrisImageUrl}
                  alt="Kode QRIS Donasi"
                  className="w-64 h-64 sm:w-72 sm:h-72"
                />
                {isExpired ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <p className="text-sm font-bold text-red-600">Kode Kadaluwarsa</p>
                  </div>
                ) : null}
              </div>

              <div className={cn(
                'mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold',
                isExpired
                  ? 'bg-red-50 text-red-600'
                  : qrisCountdown < 300
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700',
              )}>
                <Clock size={16} />
                {isExpired
                  ? 'Kode QRIS sudah kadaluwarsa'
                  : `Masa berlaku: ${formatCountdown(qrisCountdown)}`}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total Pembayaran</span>
                <span className="text-xl font-black text-emerald-700">{formatCurrency(qrisData.final_amount)}</span>
              </div>
            </div>

            {/* Tombol Unduh QR Code */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => downloadQrisImage(qrisImageUrl)}
                disabled={isExpired}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                <Download size={16} />
                Simpan Gambar QR
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
              Buka aplikasi e-wallet (DANA, GoPay, OVO, ShopeePay) atau mobile banking Anda, pilih <strong>Scan QRIS</strong>, dan arahkan ke kode di atas.
            </div>

            {/* Upload Bukti Donasi */}
            {!isExpired ? (
              <div id="qris-proof-upload-area" className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <span>Unggah Bukti Pembayaran</span>
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 uppercase">
                      * Wajib
                    </span>
                  </label>
                  {qrisProof ? (
                    <span className="text-xs font-medium text-emerald-600">
                      {(qrisProof.size / 1024).toFixed(0)} KB (akan di-autokompres)
                    </span>
                  ) : null}
                </div>

                {qrisProof && qrisProofPreview ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                      <img src={qrisProofPreview} alt="Preview Bukti Pembayaran" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{qrisProof.name}</p>
                      <p className="mt-0.5 text-xs text-emerald-700 font-semibold">Bukti siap diunggah & dikompres</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQrisProof(null);
                        setQrisProofPreview((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return null;
                        });
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Hapus Bukti"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Upload size={20} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Unggah screenshot bukti pembayaran</span>
                      <span className="mt-1 block text-xs text-gray-500 font-medium">Format JPG, PNG, WebP (maks 10MB)</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleQrisProofChange} />
                  </label>
                )}
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              {isExpired ? (
                <button
                  type="button"
                  onClick={() => {
                    resetQrisState();
                    void handleGenerateQris();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <RefreshCw size={18} />
                  Muat Ulang Kode QRIS
                </button>
              ) : (
                <button
                  type="button"
                  disabled={qrisSubmitting}
                  onClick={() => void handleQrisPaid()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-60"
                >
                  {qrisSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Konfirmasi Pembayaran'
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => resetQrisState()}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Kembali
              </button>
            </div>
          </div>
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

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {pageError ? (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 inset-x-4 mx-auto max-w-lg z-[100]"
          >
            <VAlert7
              title="Perhatian"
              message={pageError}
              onClose={() => setPageError(null)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto mt-6 max-w-3xl px-4 sm:mt-10 sm:px-6 lg:px-8">

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
                          resetQrisState();
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
                                {method.id === 'qris'
                                  ? 'Bayar melalui aplikasi e-wallet (DANA, GoPay, OVO, ShopeePay) atau mobile banking.'
                                  : method.description}
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

                {/* QRIS Statis gambar — hanya untuk legacy jika raw string belum dikonfigurasi */}
                {selectedPayment === 'qris' && !hasQrisRawString && paymentSettings.qris_image_url ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-700">Scan Kode QRIS</p>
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

                {/* Upload bukti — hanya jika BUKAN QRIS dinamis */}
                {selectedManualMethod && !isQrisDynamic ? (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                      {paymentSettings.manual_instructions}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <span>Unggah Bukti Transfer</span>
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 uppercase">
                          * Wajib
                        </span>
                      </label>
                      {paymentProof ? (
                        <span className="text-xs font-medium text-emerald-600">
                          {(paymentProof.size / 1024).toFixed(0)} KB (akan di-autokompres)
                        </span>
                      ) : null}
                    </div>

                    {paymentProof && paymentProofPreview ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                          <img src={paymentProofPreview} alt="Preview Bukti Pembayaran" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">{paymentProof.name}</p>
                          <p className="mt-0.5 text-xs text-emerald-700 font-semibold">Bukti siap diunggah & dikompres</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProof(null);
                            setPaymentProofPreview((prev) => {
                              if (prev) URL.revokeObjectURL(prev);
                              return null;
                            });
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Hapus Bukti"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Upload size={20} />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-gray-800">Unggah bukti transfer pembayaran</span>
                          <span className="mt-1 block text-xs text-gray-500 font-medium">Format JPG, PNG, WebP (maks 10MB)</span>
                        </div>
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
            disabled={isSubmitting || qrisLoading || manualPaymentUnavailable}
            className="inline-flex min-h-12 min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting || qrisLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses...
              </>
            ) : manualPaymentUnavailable ? 'Belum Tersedia' : `Donasi ${formatCurrency(selectedAmount || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
