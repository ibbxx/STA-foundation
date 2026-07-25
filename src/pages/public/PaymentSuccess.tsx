import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Share2, Heart } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useSeo } from '../../lib/seo';

/**
 * Komponen Halaman Sukses Pembayaran.
 * Ditampilkan setelah donatur berhasil menyelesaikan donasi.
 * Menampilkan pesan apresiasi yang hangat dan konfirmasi donasi.
 */
export default function PaymentSuccess() {
  useSeo({
    title: 'Terima Kasih atas Donasi Anda',
    description: 'Terima kasih atas kebaikan dan dukungan Anda untuk Sekolah Tanah Air.',
    path: '/payment/success',
    robots: 'noindex,follow',
  });

  const location = useLocation();
  const paymentState = location.state as {
    amount?: number;
    paymentMethod?: string;
    transactionId?: string | null;
    finalAmount?: number;
  } | null;

  if (!paymentState?.transactionId || !paymentState.amount || !paymentState.paymentMethod) {
    return <Navigate to="/campaigns" replace />;
  }

  async function handleShare() {
    const shareData = {
      title: 'Sekolah Tanah Air',
      text: 'Saya baru saja berdonasi untuk membantu pendidikan anak-anak bersama Sekolah Tanah Air. Mari bantu wujudkan masa depan mereka!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback jika batal share
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-24 pb-12 sm:pt-32 sm:pb-20">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 text-center shadow-xl shadow-emerald-100 sm:rounded-[3rem] sm:p-10 md:p-14 md:shadow-2xl">
        {/* Dekorasi Latar Belakang */}
        <div className="absolute top-0 left-0 h-2 w-full bg-emerald-500" />
        <div className="absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-emerald-50 blur-3xl" />

        <div className="relative z-10 space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:h-24 sm:w-24">
            <CheckCircle2 size={48} className="text-emerald-600" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl md:text-4xl">
              Terima Kasih atas Kebaikan Anda! <Heart className="inline-block h-7 w-7 text-emerald-600 fill-emerald-600 align-text-bottom" />
            </h1>
            <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
              Donasi Anda telah berhasil kami terima. Dukungan Anda sangat berarti untuk membantu masa depan pendidikan anak-anak bersama <strong>Sekolah Tanah Air</strong>.
            </p>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5 sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold uppercase tracking-wider text-gray-500">Jumlah Donasi</span>
              <span className="text-xl font-black text-emerald-700">{formatCurrency(paymentState.finalAmount || paymentState.amount)}</span>
            </div>
            <div className="h-px w-full bg-emerald-100" />
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold uppercase tracking-wider text-gray-500">Metode Pembayaran</span>
              <span className="font-bold text-gray-900">{paymentState.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold uppercase tracking-wider text-gray-500">ID Transaksi</span>
              <span className="text-right font-mono font-bold text-gray-900 break-all">{paymentState.transactionId}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/campaigns"
              className="block w-full rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-200"
            >
              Lihat Program & Campaign Lainnya
            </Link>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex w-full items-center justify-center space-x-2 rounded-2xl py-3.5 text-base font-bold text-emerald-600 transition-all hover:bg-emerald-50"
            >
              <Share2 size={18} />
              <span>Bagikan Kebaikan Ini</span>
            </button>
          </div>

          <div className="pt-2">
            <Link to="/" className="flex items-center justify-center text-sm font-bold text-gray-400 transition-colors hover:text-emerald-600">
              Kembali ke Beranda
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
