/** 14700 → "14.7K", 1170000 → "1.17M" (matches the leaderboard/hearts labels in the design). */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) {
    return String(value);
  }
  if (abs < 1_000_000) {
    return `${trim(value / 1000)}K`;
  }
  return `${trim(value / 1_000_000)}M`;
}

function trim(n: number): string {
  const fixed = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
  return fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

/** 4900 → "4,900" */
export function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const MONTH_SHORT = MONTH_NAMES.map(m => m.slice(0, 3));

/** (20, 12) → "20 Dec" */
export function formatBirthday(day?: number | null, month?: number | null): string | null {
  if (!day || !month || month < 1 || month > 12) {
    return null;
  }
  return `${day} ${MONTH_SHORT[month - 1]}`;
}

/** 5400 → "1.5", 90000 → "25" (hours, trimmed). */
export function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours >= 100) {
    return hours.toFixed(0);
  }
  return hours.toFixed(1).replace(/\.0$/, '');
}

/** 5d 15h → "5 days 15 hrs"; under a day → "15 hrs 37 mins"; never negative. */
export function formatCountdown(ms: number): string {
  const totalMins = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ${hours} hrs`;
  }
  return `${hours} hrs ${mins} mins`;
}

/** "just now", "5 min ago", "3 hrs ago", "2 days ago", or the date for anything older than a week. */
export function formatTimeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins} min ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  return new Date(iso).toLocaleDateString();
}
