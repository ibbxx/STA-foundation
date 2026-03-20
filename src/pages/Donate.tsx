import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Heart, ShieldCheck, ArrowLeft,
  CreditCard, Wallet, QrCode, Banknote,
  CheckCircle2, Lock
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

// Skema validasi form donasi menggunakan Zod
// Menjamin input pengguna sesuai dengan kriteria yang dibutuhkan sebelum pengiriman data
const donationSchema = z.object({
  amount: z.number().min(10000, 'Minimal donasi Rp 10.000'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp tidak valid'),
  message: z.string().optional(),
  isAnonymous: z.boolean(), // Opsi untuk tidak menampilkan nama di riwayat donasi
  paymentMethod: z.string().min(1, 'Pilih metode pembayaran'),
});

// Tipe data form yang diekstrak dari skema validasi Zod
type DonationFormValues = z.infer<typeof donationSchema>;

// Opsi nominal cepat untuk memudahkan donatur
const QUICK_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

// Daftar kanal pembayaran terintegrasi
const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS (Gopay, OVO, Dana, LinkAja)', icon: QrCode },
  { id: 'va_bca', name: 'BCA Virtual Account', icon: CreditCard },
  { id: 'va_mandiri', name: 'Mandiri Virtual Account', icon: CreditCard },
  { id: 'gopay', name: 'GoPay', icon: Wallet },
  { id: 'shopeepay', name: 'ShopeePay', icon: Wallet },
];

/**
 * Komponen Halaman Donasi (Form checkout).
 * Mengelola pengisian biodata donatur, pemilihan metode pembayaran, 
 * dan validasi proses transaksi menuju gerbang pembayaran (payment gateway).
 */
export default function Donate() {
  const { slug } = useParams();
  const navigate = useNavigate();
  // State untuk melacak status pengiriman form ke backend
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi penggunaan useForm dengan resolver validasi Zod
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 50000, // Nominal acuan awal
      isAnonymous: false,
      paymentMethod: '',
      name: '',
      email: '',
      whatsapp: '',
      message: ''
    }
  });

  // Melacak perubahan pada kolom nominal dan metode pembayaran
  const selectedAmount = watch('amount');
  const selectedPayment = watch('paymentMethod');

  // Penanganan (Handler) proses pengiriman donasi
  const onSubmit = async (data: DonationFormValues) => {
    setIsSubmitting(true);
    // Simulasi penundaan panggilan antarmuka pemrograman aplikasi (API call)
    setTimeout(() => {
      setIsSubmitting(false);
      // Mengarahkan ke halaman sukses pasca pembayaran simulasi
      navigate('/payment/success');
    }, 2000);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-emerald-600 font-bold text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali ke Campaign
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
              <Heart className="text-emerald-600 w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Donasi Sekarang</h1>
              <p className="text-gray-500 text-sm font-medium">Beasiswa Pendidikan Anak Pesisir di Lombok</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Amount Section */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-emerald-100/30 space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <Banknote size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Pilih Nominal Donasi</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue('amount', amt)}
                  className={cn(
                    "py-4 rounded-2xl border-2 font-bold transition-all",
                    selectedAmount === amt
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                      : "border-gray-100 hover:border-emerald-200 text-gray-600"
                  )}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Nominal Lainnya</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="0"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs font-bold">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Donor Info Section */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-emerald-100/30 space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Informasi Donatur</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Masukkan nama Anda"
                />
                {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="email@anda.com"
                />
                {errors.email && <p className="text-red-500 text-xs font-bold">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nomor WhatsApp</label>
              <input
                {...register('whatsapp')}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="0812xxxxxxx"
              />
              {errors.whatsapp && <p className="text-red-500 text-xs font-bold">{errors.whatsapp.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pesan / Doa (Opsional)</label>
              <textarea
                {...register('message')}
                rows={3}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Tulis doa atau pesan dukungan Anda..."
              />
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <input
                type="checkbox"
                id="isAnonymous"
                {...register('isAnonymous')}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isAnonymous" className="text-sm font-bold text-gray-600 cursor-pointer">
                Sembunyikan nama saya (Donasi Anonim)
              </label>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-emerald-100/30 space-y-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
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
                    "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                    selectedPayment === method.id
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-gray-100 hover:border-emerald-100"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-2 rounded-xl",
                      selectedPayment === method.id ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                    )}>
                      <method.icon size={20} />
                    </div>
                    <span className={cn(
                      "font-bold text-sm",
                      selectedPayment === method.id ? "text-emerald-700" : "text-gray-600"
                    )}>
                      {method.name}
                    </span>
                  </div>
                  {selectedPayment === method.id && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.paymentMethod && <p className="text-red-500 text-xs font-bold">{errors.paymentMethod.message}</p>}
          </div>

          {/* Submit Section */}
          <div className="space-y-6">
            <div className="bg-emerald-900 text-white p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="text-emerald-400" />
                <span className="text-sm font-bold">Pembayaran Aman & Terenkripsi</span>
              </div>
              <Lock size={18} className="text-emerald-400/50" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full py-5 rounded-[2rem] text-xl font-black text-white transition-all shadow-2xl shadow-emerald-200",
                isSubmitting ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Donasi...</span>
                </div>
              ) : (
                `Donasi ${formatCurrency(selectedAmount)}`
              )}
            </button>
            <p className="text-center text-xs text-gray-400 font-medium">
              Dengan berdonasi, Anda menyetujui <button type="button" className="underline">Syarat & Ketentuan</button> Sekolah Tanah Air.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
