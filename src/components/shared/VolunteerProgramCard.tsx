import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowRight, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { VolunteerProgramData } from '../../lib/public/events';
import OptimizedImage from '../ui/OptimizedImage';
import { isExternalUrl, safeNormalizeUrl } from '../../lib/sanitize';

/**
 * Properti untuk komponen VolunteerProgramCard.
 */
interface VolunteerProgramCardProps {
  program: VolunteerProgramData;
  className?: string;
}

/** Mapping label jenis program */
const PROGRAM_TYPE_LABELS: Record<string, string> = {
  jelajah: 'Jelajah Tanah Air',
  eduxplore: 'EduXplore Tanah Air',
  'bangun-asa': 'Bangun 1000 Asa',
};

/** Mapping warna badge jenis program */
const PROGRAM_TYPE_BADGE: Record<string, string> = {
  jelajah: 'bg-sky-50 text-sky-700 border-sky-100',
  eduxplore: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bangun-asa': 'bg-amber-50 text-amber-700 border-amber-100',
};

/** Mapping badge status pendaftaran */
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: 'Pendaftaran Buka', className: 'bg-emerald-600 text-white' },
  ongoing: { label: 'Sedang Berjalan', className: 'bg-blue-600 text-white' },
  closed: { label: 'Ditutup', className: 'bg-gray-500 text-white' },
};

/**
 * Menghitung hari tersisa hingga tanggal penutupan pendaftaran.
 */
function getDaysUntil(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Komponen kartu Program Relawan (EduXplore, Jelajah, dll).
 * Dirancang konsisten dengan CampaignCard & EventCard.
 * Menampilkan status pendaftaran, countdown, lokasi, dan CTA.
 */
export default function VolunteerProgramCard({ program, className }: VolunteerProgramCardProps) {
  const isOpen = program.status === 'open';
  const isOngoing = program.status === 'ongoing';
  const statusInfo = STATUS_BADGE[program.status] ?? STATUS_BADGE.closed;
  const typeLabel = PROGRAM_TYPE_LABELS[program.program_type] ?? program.program_type;
  const typeBadge = PROGRAM_TYPE_BADGE[program.program_type] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const daysLeft = getDaysUntil(program.registration_end);

  // Link ke halaman detail program atau pendaftaran
  const targetUrl = safeNormalizeUrl(
    program.external_link || `/eduxplore/${program.slug}`,
    `/eduxplore/${program.slug}`,
  );
  const isExternal = targetUrl && isExternalUrl(targetUrl);

  const cardContent = (
    <>
      {/* ── Gambar & Badge ── */}
      <div className="relative aspect-video w-full overflow-hidden sm:aspect-[16/10]">
        <OptimizedImage
          src={program.image_url ?? 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop'}
          alt={program.title}
          isThumbnail
          className="transition-transform duration-500 md:group-hover:scale-105"
        />
        {/* Status Badge (kiri atas) */}
        <div
          className={cn(
            'absolute left-2.5 top-2.5 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm',
            statusInfo.className,
          )}
        >
          {statusInfo.label}
        </div>
        {/* Program Type Badge (kanan atas) */}
        <div
          className={cn(
            'absolute right-2.5 top-2.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm',
            typeBadge,
          )}
        >
          {typeLabel}
        </div>
      </div>

      {/* ── Konten Detail ── */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-6">
        {/* Lokasi */}
        <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 sm:text-xs">
          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="truncate">{program.location}</span>
        </p>

        {/* Judul */}
        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-600 sm:text-lg tracking-tight">
          {program.title}
        </h3>


        {/* ── Metadata & CTA ── */}
        <div className="mt-auto space-y-3 pt-2 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            {/* Countdown / Status Tanggal */}
            {isOpen && daysLeft !== null && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-emerald-500" />
                <span className="font-medium">
                  {daysLeft === 0
                    ? 'Hari terakhir pendaftaran!'
                    : `${daysLeft} hari lagi menuju penutupan`
                  }
                </span>
              </div>
            )}
            {program.registration_start && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-emerald-500" />
                <span className="font-medium truncate">
                  {new Date(program.registration_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {program.registration_end && (
                    <> — {new Date(program.registration_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* CTA / Footer */}
          <div className="flex items-center justify-end pt-2 border-t border-gray-50">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold transition-colors',
                isOpen || isOngoing
                  ? 'text-emerald-600 group-hover:text-emerald-800'
                  : 'text-gray-500 group-hover:text-gray-700',
              )}
            >
              {isOpen ? 'Daftar Sekarang' : 'Lihat Detail'}
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const cardClassName = cn(
    'group flex flex-col overflow-hidden bg-white border rounded-sm shadow-sm transition-all',
    'hover:shadow-md md:hover:shadow-xl',
    isOpen ? 'border-emerald-200' : 'border-gray-100',
    className,
  );

  if (isExternal) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className={cardClassName}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      to={targetUrl}
      className={cardClassName}
    >
      {cardContent}
    </Link>
  );
}
