import { Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import { getCampaignTemporalStatus } from '../admin/campaigns/CampaignStatusBadge';

type CampaignStatsCardProps = {
  currentAmount: number;
  targetAmount: number;
  progress: number;
  donorCount: number;
  daysLeft: number | null;
  slug: string;
  startDate?: string | null;
  endDate?: string | null;
  dbStatus?: string | null;
  /** Visual variant: 'compact' for mobile, 'full' for desktop sidebar */
  variant?: 'compact' | 'full';
};

export default function CampaignStatsCard({
  currentAmount,
  targetAmount,
  progress,
  donorCount,
  daysLeft,
  slug,
  startDate,
  endDate,
  dbStatus,
  variant = 'compact',
}: CampaignStatsCardProps) {
  const isDesktop = variant === 'full';
  const temporalStatus = getCampaignTemporalStatus(startDate, endDate);
  const status = dbStatus === 'upcoming' ? 'Upcoming' : temporalStatus;
  const canDonate = status === 'Ongoing';

  return (
    <div className={`rounded-sm border border-gray-100 bg-white flex flex-col gap-6 ${isDesktop ? 'p-6' : 'p-5 space-y-4'}`}>
      <div className={isDesktop ? 'space-y-1' : 'space-y-3'}>
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dana Terkumpul</p>
          <div className="flex items-baseline gap-2">
            <p className={`font-bold text-gray-900 ${isDesktop ? 'text-3xl tracking-tighter' : 'text-2xl'}`}>
              {formatCurrency(currentAmount)}
            </p>
            <p className={`font-medium ${isDesktop ? 'text-[10px] text-gray-400' : 'text-xs text-gray-500'}`}>
              Target: {formatCurrency(targetAmount)}
            </p>
          </div>
        </div>

        <div className={isDesktop ? 'space-y-4' : ''}>
          <div className="h-1.5 w-full overflow-hidden bg-gray-50">
            <div
              className="h-full bg-emerald-600 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-tight text-gray-500 ${!isDesktop ? 'border-t border-gray-50 pt-3' : ''}`}>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-emerald-600" />
              <span>{donorCount} Donatur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-600" />
              <span>{daysLeft === null ? 'Menyusul' : `${daysLeft} Hari Lagi`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col gap-2 ${isDesktop ? 'pt-2 border-t border-gray-50' : ''}`}>
        {canDonate ? (
          <Link
            to={`/donate/${slug}`}
            className={`flex w-full items-center justify-center rounded-sm bg-gray-900 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-600 ${isDesktop ? 'py-4' : 'py-3.5'}`}
          >
            Donasi Sekarang
          </Link>
        ) : (
          <div
            className={`flex w-full items-center justify-center rounded-sm bg-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400 cursor-not-allowed ${isDesktop ? 'py-4' : 'py-3.5'}`}
          >
            {temporalStatus === 'Upcoming' ? 'Upcoming' : 'Donasi Selesai'}
          </div>
        )}
      </div>
    </div>
  );
}
