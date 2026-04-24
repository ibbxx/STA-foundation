import { cn } from '../../../lib/utils';

export type CampaignTemporalStatus = 'Upcoming' | 'Ongoing' | 'Ended';

export function getCampaignTemporalStatus(startDate?: string | null, endDate?: string | null): CampaignTemporalStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!startDate || !endDate) {
    return 'Upcoming';
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (today < start) return 'Upcoming';
  if (today > end) return 'Ended';
  return 'Ongoing';
}

type CampaignStatusBadgeProps = {
  startDate?: string | null;
  endDate?: string | null;
  className?: string;
};

export default function CampaignStatusBadge({ startDate, endDate, className }: CampaignStatusBadgeProps) {
  const status = getCampaignTemporalStatus(startDate, endDate);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        status === 'Upcoming' && 'bg-slate-100 text-slate-600',
        status === 'Ongoing' && 'bg-emerald-50 text-emerald-700',
        status === 'Ended' && 'bg-orange-50 text-orange-700',
        className,
      )}
    >
      {status}
    </span>
  );
}
