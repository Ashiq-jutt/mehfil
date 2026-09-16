import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { nextPageOf } from '../../../api/clubs';
import { GLOBAL_COUNTRY, useClubsFilterStore } from '../../../store/clubsFilterStore';
import { ClubCard } from '../ClubCard';
import type { ClubCardDto } from '../../../api/types';

const club: ClubCardDto = {
  id: '29451765',
  name: 'ANAYA',
  coverUrl: null,
  countryCode: 'PK',
  flagEmoji: '🇵🇰',
  categoryCode: 'friends',
  categoryName: 'Friends',
  level: 20,
  onlineCount: 0,
  memberCount: 15,
  followerCount: 3,
  totalHearts: 335300,
  isLive: false,
  isFollowing: false,
  isMine: false,
};

describe('ClubCard', () => {
  it('shows name, level, member count and category; presses navigate and follow', async () => {
    const onPress = jest.fn();
    const onToggleFollow = jest.fn();
    await render(<ClubCard club={club} onPress={onPress} onToggleFollow={onToggleFollow} />);

    expect(screen.getByText('ANAYA')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('Friends')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Follow'));
    expect(onToggleFollow).toHaveBeenCalledWith(club);

    await fireEvent.press(screen.getByLabelText('ANAYA, level 20'));
    expect(onPress).toHaveBeenCalledWith(club);
  });

  it('shows the MY CLUB ribbon and hides the follow heart for the owner', async () => {
    await render(<ClubCard club={{ ...club, isMine: true }} onPress={jest.fn()} onToggleFollow={jest.fn()} />);

    expect(screen.getByText('MY CLUB')).toBeTruthy();
    expect(screen.queryByLabelText('Follow')).toBeNull();
  });

  it('shows the live online count when the club is live', async () => {
    await render(<ClubCard club={{ ...club, isLive: true, onlineCount: 7 }} onPress={jest.fn()} onToggleFollow={jest.fn()} />);

    expect(screen.getByText('7')).toBeTruthy();
  });
});

describe('nextPageOf', () => {
  it('returns the next page while more items remain', () => {
    expect(nextPageOf({ items: [], page: 1, pageSize: 20, totalCount: 45 })).toBe(2);
    expect(nextPageOf({ items: [], page: 3, pageSize: 20, totalCount: 45 })).toBeUndefined();
    expect(nextPageOf({ items: [], page: 1, pageSize: 20, totalCount: 0 })).toBeUndefined();
  });
});

describe('clubsFilterStore', () => {
  it('defaults to Global and updates', () => {
    expect(useClubsFilterStore.getState().country).toEqual(GLOBAL_COUNTRY);
    useClubsFilterStore.getState().setCountry({ code: 'PK', name: 'Pakistan', flagEmoji: '🇵🇰', isFeatured: true });
    expect(useClubsFilterStore.getState().country.code).toBe('PK');
  });
});
