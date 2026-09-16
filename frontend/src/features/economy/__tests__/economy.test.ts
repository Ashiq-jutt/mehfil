import { formatCountdown } from '../../room/dialogs/ClubLevelsDialog';
import { formatPrice, giftEmoji } from '../giftIcons';

describe('giftIcons', () => {
  it('maps known gifts and falls back for unknown ones', () => {
    expect(giftEmoji('rose')).toBe('🌹');
    expect(giftEmoji('nope')).toBe('🎁');
  });

  it('formats PKR prices from minor units', () => {
    expect(formatPrice(30000, 'PKR')).toBe('Rs 300');
    expect(formatPrice(2990000, 'PKR')).toBe('Rs 29,900');
    expect(formatPrice(1999, 'USD')).toBe('19.99 USD');
  });
});

describe('formatCountdown', () => {
  it('renders hours and minutes, clamping at zero', () => {
    expect(formatCountdown(15 * 3600_000 + 37 * 60_000)).toBe('15 hrs 37 mins');
    expect(formatCountdown(-5000)).toBe('0 hrs 0 mins');
  });
});
