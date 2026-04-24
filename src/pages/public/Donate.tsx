import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Heart,
  ArrowLeft,
  CreditCard,
  Wallet,
  QrCode,
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { fetchPublicCampaignForDonate } from '../../lib/public-campaigns';
import { Campaign, DonationInsert, supabase } from '../../lib/supabase';
import { formatCurrency, cn } from '../../lib/utils';

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

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS (Gopay, OVO, Dana, LinkAja)', icon: QrCode },
  { id: 'va_bca', name: 'BCA Virtual Account', icon: CreditCard },
  { id: 'va_mandiri', name: 'Mandiri Virtual Account', icon: CreditCard },
  { id: 'gopay', name: 'GoPay', icon: Wallet },
  { id: 'shopeepay', name: 'ShopeePay', icon: Wallet },
] as const;

export default function Donate() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 50000,
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
          setPageError('Campaign tidak ditemukan.');
        }
      } catch (loadError) {
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

  const onSubmit = async (data: DonationFormValues) => {
    if (!campaign) return;

    setIsSubmitting(true);
    setPageError(null);

    const payload: DonationInsert = {
      campaign_id: campaign.id,
      donor_name: data.name.trim(),
      donor_email: data.email.trim(),
      donor_phone: data.whatsapp.trim(),
      amount: data.amount,
      payment_status: 'success',
      payment_method: data.paymentMethod,
      message: data.message?.trim() || null,
      is_anonymous: data.isAnonymous,
    };

    const { data: insertedDonationData, error } = await supabase
      .from('donations')
      .insert(payload as never)
      .select('id')
      .single();

    if (error) {
      setPageError(error.message);
      setIsSubmitting(false);
      return;
    }

    const paymentMethodLabel = PAYMENT_METHODS.find((method) => method.id === data.paymentMethod)?.name ?? data.paymentMethod;
    const insertedDonation = insertedDonationData as { id: string } | null;

    navigate('/payment/success', {
      state: {
        amount: data.amount,
        paymentMethod: paymentMethodLabel,
        transactionId: insertedDonation?.id ?? null,
      },
    });
  };

  if (loadingCampaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500 shadow-sm">
          Memuat halaman donasi...
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Campaign tidak ditemukan</h1>
          <p className="mt-3 text-sm text-gray-500">{pageError ?? 'Campaign yang Anda cari belum tersedia.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 md:pb-24">
      <div className="border-b border-gray-100 bg-white py-8 sm:py-10">
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

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setValue('amount', amount)}
                  className={cn(
                    'min-h-14 rounded-2xl border-2 px-3 py-4 text-sm font-bold transition-all',
                    selectedAmount === amount
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                      : 'border-gray-100 text-gray-600 hover:border-emerald-200',
                  )}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

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
            <div className="mb-2 flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Metode Pembayaran</h2>
            </div>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setValue('paymentMethod', method.id)}
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
                        <method.icon size={20} />
                      </div>
                      <span
                        className={cn(
                          'block text-sm font-bold leading-relaxed',
                          selectedPayment === method.id ? 'text-emerald-700' : 'text-gray-600',
                        )}
                      >
                        {method.name}
                      </span>
                    </div>
                    {selectedPayment === method.id ? (
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 sm:mt-0">
                        <CheckCircle2 size={14} className="text-white" />
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
            {errors.paymentMethod ? <p className="text-xs font-bold text-red-500">{errors.paymentMethod.message}</p> : null}
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
            disabled={isSubmitting}
            className="inline-flex min-h-12 min-w-[160px] items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : `Donasi ${formatCurrency(selectedAmount || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
