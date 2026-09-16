import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { Skeleton, SkeletonList } from '../ui/Skeleton';
import { ClubGridSkeleton } from '../../features/clubs/ClubGridSkeleton';
import { LeaderboardSkeleton } from '../../features/leaderboard/LeaderboardSkeleton';

describe('Skeleton', () => {
  it('renders a block and a repeated list', async () => {
    await render(
      <SkeletonList count={3}>
        {index => <Skeleton key={index} height={20} />}
      </SkeletonList>,
    );

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('labels the club grid placeholder for screen readers', async () => {
    await render(<ClubGridSkeleton rows={2} />);
    expect(screen.getByLabelText('Loading clubs')).toBeTruthy();
  });

  it('labels the leaderboard placeholder for screen readers', async () => {
    await render(<LeaderboardSkeleton rows={2} />);
    expect(screen.getByLabelText('Loading leaderboard')).toBeTruthy();
  });
});
