import { formatCompact, formatNumber } from '../format';

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
