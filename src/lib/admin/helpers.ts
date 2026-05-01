import { Json } from '../supabase/types';

export function formatAdminDate(value?: string, withTime = false) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function getInitials(value?: string) {
  if (!value) return 'AD';

  const parts = value
    .replace(/[@._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'AD';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function previewJson(value: Json, maxLength = 96) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  if (!raw) return '-';

  return raw.length > maxLength ? `${raw.slice(0, maxLength)}...` : raw;
}
