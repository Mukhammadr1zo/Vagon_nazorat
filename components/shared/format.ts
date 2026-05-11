// Vaqt, raqam, sana formatlash yordamchilari

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('uz-UZ', opts).format(n);
}

export function formatKm(km: number): string {
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)}M км`;
  if (km >= 1000) return `${(km / 1000).toFixed(1)}K км`;
  return `${Math.round(km).toLocaleString()} км`;
}

export function formatMinutes(min: number): string {
  // ko'rsatish uchun: faqat kun (1 raqamdan keyin verguldan keyin)
  if (min <= 0) return '—';
  return formatDays(min / 1440);
}

export function formatDays(days: number): string {
  if (!isFinite(days) || days <= 0) return '—';
  if (days < 1) return `${days.toFixed(2)} kun`;
  if (days < 10) return `${days.toFixed(1)} kun`;
  return `${Math.round(days)} kun`;
}

export function toDays(minutes: number): number {
  return minutes / 1440;
}

export function formatDate(ts: number, withTime = false): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const date = d.toLocaleDateString('uz-UZ', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZone: 'UTC',
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('uz-UZ', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${date} ${time}`;
}

export function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
