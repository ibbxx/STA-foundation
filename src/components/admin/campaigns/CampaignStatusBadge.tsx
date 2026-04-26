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
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border',
        status === 'Upcoming' && 'border-zinc-200 bg-zinc-50 text-zinc-500',
        status === 'Ongoing' && 'border-zinc-900 bg-zinc-100 text-zinc-900',
        status === 'Ended' && 'border-zinc-200 bg-white text-zinc-400',
        className,
      )}
    >
      {status}
    </span>
  );
}
