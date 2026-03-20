import { Link } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { Campaign } from '../lib/supabase';
import { formatCurrency, calculateProgress, cn } from '../lib/utils';

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
  // Menghitung persentase progres donasi dari target yang ditetapkan
  const progress = calculateProgress(campaign.current_amount, campaign.target_amount);

  // Data sementara (mock) untuk menghitung sisa waktu kampanye
  const daysLeft = 15;

  return (
    <div className={cn("group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-300", className)}>
      {/* Visualisasi Kartu: Gambar dan Label Kategori */}
      <Link to={`/campaigns/${campaign.slug}`} className="block relative aspect-[16/10] overflow-hidden">
        <img
          src={campaign.thumbnail_url || `https://picsum.photos/seed/${campaign.id}/800/500`}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Pendidikan
          </span>
        </div>
      </Link>

      {/* Detail Konten Kampanye */}
      <div className="p-6">
        <Link to={`/campaigns/${campaign.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {campaign.title}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">
          {campaign.short_description}
        </p>

        {/* Informasi Progres Penggalangan Dana */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-emerald-600">{formatCurrency(campaign.current_amount)}</span>
              <span className="text-gray-400">Target: {formatCurrency(campaign.target_amount)}</span>
            </div>
            {/* Indikator Bar Progres */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Statistik Donatur dan Sisa Waktu */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center text-gray-500 text-xs">
              <Users size={14} className="mr-1.5 text-emerald-500" />
              <span className="font-medium">{campaign.donor_count || 0} Donatur</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Clock size={14} className="mr-1.5 text-emerald-500" />
              <span className="font-medium">{daysLeft} Hari Lagi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
