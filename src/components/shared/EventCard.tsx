import { Link } from 'react-router-dom';
import { MapPinned, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type EventMapLocation } from '../../lib/public/events';
import OptimizedImage from '../ui/OptimizedImage';
import { isExternalUrl, safeNormalizeUrl } from '../../lib/sanitize';

/**
 * Properti untuk komponen EventCard.
 */
interface EventCardProps {
  event: EventMapLocation;
  isSelected?: boolean;
  onSelect?: (event: EventMapLocation) => void;
  className?: string;
}

/**
 * Mengekstrak angka persentase dari string seperti "80% Selesai" atau "80%".
 * Mengembalikan angka antara 0-100, atau null jika tidak ditemukan.
 */
function extractPercentage(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = text.match(/(\d{1,3})\s*%/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  return value >= 0 && value <= 100 ? value : null;
}

/** Konfigurasi visual badge status */
const STATUS_BADGE_STYLES: Record<EventMapLocation['status'], string> = {
  'Akan Datang': 'bg-blue-50 text-blue-700 border-blue-100',
  'Berjalan': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Selesai': 'bg-gray-100 text-gray-600 border-gray-200',
};

/**
 * Komponen kartu untuk menampilkan informasi ringkas dari sebuah event/kegiatan.
 * Menampilkan gambar, badge status, lokasi, progress bar, dan CTA sesuai status.
 * Terintegrasi dengan InteractiveMap melalui callback `onSelect`.
 */
export default function EventCard({ event, isSelected, onSelect, className }: EventCardProps) {
  const percentage = extractPercentage(event.journeyProgress);
  const isFinished = event.status === 'Selesai';

  // Tentukan href dan label untuk tombol aksi
  const rawActionHref = event.actionHref ?? (event.slug ? `/journey/${event.slug}` : null);
  const actionHref = rawActionHref ? safeNormalizeUrl(rawActionHref, '') : null;
  const actionLabel = event.actionLabel ?? (isFinished ? 'Lihat Detail' : 'Lihat Detail');

  const handleCardClick = () => {
    onSelect?.(event);
  };

  // Wrapper: jika ada actionHref internal, bungkus dengan Link; jika external, gunakan <a>
  const isExternal = actionHref && isExternalUrl(actionHref);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      className={cn(
        'group flex flex-col overflow-hidden bg-white border rounded-sm shadow-sm transition-all cursor-pointer',
        'hover:shadow-md md:hover:shadow-xl',
        isSelected
          ? 'border-emerald-300 ring-2 ring-emerald-500/10'
          : 'border-gray-100',
        className,
      )}
    >
      {/* ── Gambar & Badge Status ── */}
      <div className="relative aspect-video w-full overflow-hidden sm:aspect-[16/10]">
        <OptimizedImage
          src={event.imageUrl}
          alt={event.title}
          isThumbnail
          className="transition-transform duration-500 md:group-hover:scale-105"
        />
        <div
          className={cn(
            'absolute left-2.5 top-2.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm',
            STATUS_BADGE_STYLES[event.status],
          )}
        >
          {event.status}
        </div>
      </div>

      {/* ── Konten Detail ── */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-6">
        {/* Lokasi */}
        <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 sm:text-xs">
          <MapPinned className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="truncate">{event.locationLabel ?? event.province ?? 'Lokasi Event'}</span>
        </p>

        {/* Judul */}
        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-600 sm:text-lg tracking-tight">
          {event.title}
        </h3>

        {/* Deskripsi (sembunyikan di mobile) */}
        <p className="hidden sm:block mb-5 line-clamp-2 text-sm leading-relaxed text-gray-500 sm:mb-6 font-light">
          {event.description}
        </p>

        {/* ── Metadata & Progress ── */}
        <div className="mt-auto space-y-3 pt-2 sm:space-y-4">
          {/* Periode & Capaian */}
          <div className="space-y-1.5 sm:space-y-2">
            {event.journeyPeriod && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-emerald-500" />
                <span className="font-medium truncate">{event.journeyPeriod}</span>
              </div>
            )}
            {event.journeyProgress && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-xs">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-emerald-500" />
                <span className="font-medium truncate">{event.journeyProgress}</span>
              </div>
            )}
          </div>

          {/* Progress Bar (visual) */}
          {percentage !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] sm:text-xs font-bold tracking-tight">
                <span className="text-emerald-600">{percentage}%</span>
                <span className="text-gray-400 font-normal">Capaian</span>
              </div>
              <div className="h-1 w-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA / Footer */}
          {actionHref && (
            <div className="flex items-center justify-end pt-2 border-t border-gray-50">
              {isExternal ? (
                <a
                  href={actionHref}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold transition-colors',
                    isFinished
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-emerald-600 hover:text-emerald-800',
                  )}
                >
                  {actionLabel}
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </a>
              ) : (
                <Link
                  to={actionHref}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold transition-colors',
                    isFinished
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-emerald-600 hover:text-emerald-800',
                  )}
                >
                  {actionLabel}
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
