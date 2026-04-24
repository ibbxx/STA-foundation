import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Share2, Heart } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

/**
 * Komponen Halaman Sukses Pembayaran.
 * Ditampilkan setelah donatur berhasil menyelesaikan transaksi donasi.
 * Memberikan konfirmasi visual, rincian singkat transaksi, dan ajakan tindakan (CTA) lanjutan.
 */
export default function PaymentSuccess() {
  const location = useLocation();
  const paymentState = location.state as {
    amount?: number;
    paymentMethod?: string;
    transactionId?: string | null;
  } | null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:py-20">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 text-center shadow-xl shadow-emerald-100 sm:rounded-[3rem] sm:p-10 md:p-16 md:shadow-2xl">
        {/* Dekorasi Latar Belakang Geometris */}
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10" />

        <div className="space-y-8 relative z-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-bounce sm:h-24 sm:w-24">
            <CheckCircle2 size={48} className="text-emerald-600" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black text-gray-900 md:text-4xl">Donasi Berhasil!</h1>
            <p className="text-base leading-relaxed text-gray-500 sm:text-lg">
              Terima kasih atas kebaikan Anda. Donasi Anda telah kami terima dan akan segera disalurkan untuk membantu sesama.
            </p>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-wider">Jumlah Donasi</span>
              <span className="text-emerald-700 font-black text-xl">{formatCurrency(paymentState?.amount ?? 50000)}</span>
            </div>
            <div className="h-px bg-emerald-100 w-full" />
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-wider">Metode</span>
              <span className="text-gray-900 font-bold">{paymentState?.paymentMethod ?? 'QRIS / GoPay'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-500 font-bold uppercase tracking-wider">ID Transaksi</span>
              <span className="text-gray-900 font-mono font-bold">{paymentState?.transactionId ?? 'TA-98234123'}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Link
              to="/campaigns"
              className="block w-full bg-emerald-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
            >
              Lihat Campaign Lainnya
            </Link>
            <button className="w-full flex items-center justify-center space-x-2 py-4 text-emerald-600 font-bold hover:bg-emerald-50 rounded-2xl transition-all">
              <Share2 size={20} />
              <span>Bagikan Kebaikan Ini</span>
            </button>
          </div>

          <div className="pt-6">
            <Link to="/" className="text-gray-400 font-bold text-sm hover:text-emerald-600 transition-colors flex items-center justify-center">
              Kembali ke Beranda
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
