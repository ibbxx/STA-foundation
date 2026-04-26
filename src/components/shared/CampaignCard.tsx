import { Link } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { getDaysLeft } from '../../lib/public-campaigns';
import { Campaign } from '../../lib/supabase';
import { formatCurrency, calculateProgress, cn } from '../../lib/utils';
import OptimizedImage from '../ui/OptimizedImage';

/**
 * Properti untuk komponen CampaignCard
 */
interface CampaignCardProps {
  campaign: Campaign;
  className?: string;
  key?: string | number;
}

/**
 * Komponen kartu untuk menampilkan informasi ringkas dari sebuah kampanye donasi.
 * Menampilkan gambar, judul, deskripsi singkat, dan progres pendanaan.
 */
export default function CampaignCard({ campaign, className }: CampaignCardProps) {
  const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
  const daysLeft = getDaysLeft(campaign.end_date ?? campaign.deadline);
  const categoryLabel = campaign.category_name || 'Campaign';

  return (
    <Link
      to={`/campaigns/${campaign.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm transition-all hover:shadow-md",
        "md:hover:shadow-xl sm:rounded-[1.35rem]",
        className
      )}
    >
      {/* Visualisasi Kartu: Gambar dan Label Kategori */}
      <div className="relative aspect-video w-full overflow-hidden sm:aspect-[16/10]">
        <OptimizedImage
          src={campaign.thumbnail_url}
          alt={campaign.title}
          isThumbnail
          className="transition-transform duration-500 md:group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm text-emerald-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
          {categoryLabel}
        </span>
      </div>

      {/* Detail Konten Kampanye */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-6">
        <h3 className="mb-1 sm:mb-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-600 sm:text-lg">
          {campaign.title}
        </h3>

        {/* Sembunyikan deskripsi di mobile agar kartu ringkas, tampilkan di layar sm ke atas */}
        <p className="hidden sm:block mb-5 line-clamp-2 text-sm leading-relaxed text-gray-500 sm:mb-6">
          {campaign.short_description}
        </p>

        {/* Mendorong Info Progres dan Footer ke bawah agar kartu sejajar (flex-1) */}
        <div className="mt-auto space-y-3 pt-2 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-medium">
              <span className="text-emerald-600">{formatCurrency(campaign.current_amount)}</span>
              <span className="hidden sm:inline text-gray-400">Target: {formatCurrency(campaign.target_amount)}</span>
            </div>
            {/* Indikator Bar Progres */}
            <div className="h-1.5 sm:h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Statistik Donatur dan Sisa Waktu */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center text-gray-500 text-[10px] sm:text-xs">
              <Users size={14} className="mr-1 sm:mr-1.5 text-emerald-500" />
              <span className="font-medium">{campaign.donor_count || 0} Donatur</span>
            </div>
            <div className="flex items-center text-gray-500 text-[10px] sm:text-xs">
              <Clock size={14} className="mr-1 sm:mr-1.5 text-emerald-500" />
              <span className="font-medium">
                {daysLeft === null ? 'Jadwal menyusul' : `${daysLeft} Hari Lagi`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
