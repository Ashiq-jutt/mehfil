import { formatBirthday, formatCompact, formatHours, formatNumber } from '../format';
import { resolveAssetUrl } from '../assets';

describe('formatCompact', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1K'],
    [14700, '14.7K'],
    [201200, '201K'],
    [1170000, '1.17M'],
    [24900, '24.9K'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(4900)).toBe('4,900');
    expect(formatNumber(24900)).toBe('24,900');
    expect(formatNumber(350)).toBe('350');
  });
});

describe('formatBirthday', () => {
  it('renders day + short month and handles missing values', () => {
    expect(formatBirthday(20, 12)).toBe('20 Dec');
    expect(formatBirthday(1, 1)).toBe('1 Jan');
    expect(formatBirthday(null, 5)).toBeNull();
    expect(formatBirthday(5, 13)).toBeNull();
  });
});

describe('formatHours', () => {
  it('converts seconds to trimmed hours', () => {
    expect(formatHours(0)).toBe('0');
    expect(formatHours(5400)).toBe('1.5');
    expect(formatHours(90 * 3600)).toBe('90');
    expect(formatHours(110 * 3600 + 1800)).toBe('111');
  });
});

describe('resolveAssetUrl', () => {
  it('prefixes relative upload paths and leaves absolute URLs alone', () => {
    expect(resolveAssetUrl('/uploads/avatars/1/a.jpg')).toBe('http://test.local/uploads/avatars/1/a.jpg');
    expect(resolveAssetUrl('https://lh3.googleusercontent.com/x')).toBe('https://lh3.googleusercontent.com/x');
    expect(resolveAssetUrl(null)).toBeUndefined();
  });
});
