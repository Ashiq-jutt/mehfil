/** Emoji stand-ins for gift artwork until the original assets land. */
const GIFT_EMOJI: Record<string, string> = {
  rose: '🌹',
  chocolate: '🍫',
  bouquet: '💐',
  teddy: '🧸',
  perfume: '🧴',
  crown: '👑',
  ring: '💍',
  sportscar: '🏎️',
  yacht: '🛥️',
  castle: '🏰',
};

export function giftEmoji(code: string): string {
  return GIFT_EMOJI[code] ?? '🎁';
}

/** 30000 (paisa) + "PKR" → "Rs 300" */
export function formatPrice(priceMinor: number, currency: string): string {
  const major = priceMinor / 100;
  const text = Number.isInteger(major) ? major.toLocaleString() : major.toFixed(2);
  return currency === 'PKR' ? `Rs ${text}` : `${text} ${currency}`;
}
