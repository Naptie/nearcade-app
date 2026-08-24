import type { OpeningHours } from '@/api/types';

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatRelativeTime(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units: [number, { en: string; zh: string; ja: string }][] = [
    [31536000, { en: 'y', zh: '年', ja: '年' }],
    [2592000, { en: 'mo', zh: '个月', ja: 'ヶ月' }],
    [604800, { en: 'w', zh: '周', ja: '週間' }],
    [86400, { en: 'd', zh: '天', ja: '日' }],
    [3600, { en: 'h', zh: '小时', ja: '時間' }],
    [60, { en: 'm', zh: '分钟', ja: '分' }],
  ];
  const lang = locale.startsWith('zh') ? 'zh' : locale.startsWith('ja') ? 'ja' : 'en';
  for (const [secs, label] of units) {
    if (seconds >= secs) {
      const value = Math.floor(seconds / secs);
      if (lang === 'en') return `${value}${label.en} ago`;
      return `${value}${label[lang]}前`;
    }
  }
  return lang === 'en' ? 'just now' : lang === 'ja' ? 'たった今' : '刚刚';
}

/**
 * Returns the shop's hours for a given instant using its UTC offset.
 * nearcade's openingHours is either length-1 (whole week) or length-7
 * (Mon-first weekdays).
 */
export function hoursForInstant(hours: OpeningHours | undefined, utcOffsetMinutes: number, at = new Date()) {
  if (!hours || hours.length === 0) return null;
  // Shift the instant into shop-local time.
  const local = new Date(at.getTime() + utcOffsetMinutes * 60000);
  // getUTCDay on shifted date gives local weekday; convert Sunday=0 → index 6.
  const weekdayIndex = (local.getUTCDay() + 6) % 7;
  const dayHours = hours.length === 7 ? hours[weekdayIndex] : hours[0];
  return dayHours ?? null;
}

export function computeIsOpen(hours: OpeningHours | undefined, utcOffset: number | undefined, at = new Date()): boolean | null {
  if (!utcOffset && utcOffset !== 0) return null;
  const dayHours = hoursForInstant(hours, utcOffset, at);
  if (!dayHours || dayHours.length < 2) return null;
  const local = new Date(at.getTime() + utcOffset * 60000);
  const minutesNow = local.getUTCHours() * 60 + local.getUTCMinutes();
  const [openT, closeT] = dayHours;
  const open = openT.hour * 60 + openT.minute;
  let close = closeT.hour * 60 + closeT.minute;
  if (close <= open) close += 24 * 60; // overnight
  const nowAdj = minutesNow < open ? minutesNow + 24 * 60 : minutesNow;
  return nowAdj >= open && nowAdj <= close;
}

export function openingHoursText(hours: OpeningHours | undefined): string {
  if (!hours || hours.length === 0) return '—';
  const fmt = (t: { hour: number; minute: number }) =>
    `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
  return hours.map((day) => day.map(fmt).join(' – ')).join(' / ');
}
