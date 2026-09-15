import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { formatCountdown } from '../../../utils/format';
import { formatRank, subjectHeading } from '../leaderboardCopy';
import { RankRow } from '../RankRow';
import type { LeaderboardEntryDto } from '../../../api/types';

const club: LeaderboardEntryDto = {
  rank: 1,
  id: '12345678',
  name: 'Gentle talk',
  imageUrl: null,
  countryCode: 'PK',
  flagEmoji: '🇵🇰',
  level: 42,
  royalLevel: 'None',
  score: 201_200,
};

describe('leaderboard copy', () => {
  it('collapses far ranks like the sticky me row', () => {
    expect(formatRank(1)).toBe('1');
    expect(formatRank(200)).toBe('200');
    expect(formatRank(2481)).toBe('200+');
  });

  it('names the middle column per board', () => {
    expect(subjectHeading('TopClubs')).toBe('CLUB');
    expect(subjectHeading('TopGifters')).toBe('GIFTER');
    expect(subjectHeading('TopReceivers')).toBe('RECEIVER');
  });
});

describe('formatCountdown', () => {
  it('switches to days for weekly periods', () => {
    expect(formatCountdown(5 * 86_400_000 + 15 * 3_600_000 + 20 * 60_000)).toBe('5 days 15 hrs');
    expect(formatCountdown(1 * 86_400_000)).toBe('1 day 0 hrs');
    expect(formatCountdown(15 * 3_600_000 + 52 * 60_000)).toBe('15 hrs 52 mins');
  });
});

describe('RankRow', () => {
  it('renders a club row with level and compact hearts', async () => {
    await render(<RankRow entry={club} board="TopClubs" />);
    expect(screen.getByText('Gentle talk')).toBeTruthy();
    expect(screen.getByText('Lv 42')).toBeTruthy();
    expect(screen.getByText('201K')).toBeTruthy();
  });

  it('renders a user row with a royal crest instead of a level', async () => {
    await render(<RankRow entry={{ ...club, rank: 4, name: 'Dani', royalLevel: 'R3', score: 290 }} board="TopGifters" />);
    expect(screen.getByText('Dani')).toBeTruthy();
    expect(screen.queryByText('Lv 42')).toBeNull();
    expect(screen.getByText('290')).toBeTruthy();
  });
});
