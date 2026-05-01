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
  slug?: string | null;
  dbStatus?: string | null;
};

export default function CampaignStatusBadge({ startDate, endDate, className, slug, dbStatus }: CampaignStatusBadgeProps) {
  const temporalStatus = getCampaignTemporalStatus(startDate, endDate);
  const status = dbStatus === 'upcoming' ? 'Upcoming' : temporalStatus;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium border transition-colors',
        status === 'Upcoming' && 'border-zinc-200 bg-zinc-50 text-zinc-500',
        status === 'Ongoing' && 'border-zinc-900 bg-zinc-100 text-zinc-900',
        status === 'Ended' && 'border-zinc-200 bg-white text-zinc-400',
        slug && 'hover:bg-zinc-200/50 cursor-pointer',
        className,
      )}
    >
      {status}
    </span>
  );

  if (slug) {
    return (
      <a
        href={`/campaigns/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Buka halaman publik"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
