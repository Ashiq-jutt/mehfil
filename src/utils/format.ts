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
