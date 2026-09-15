import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { notificationTarget, parseNotificationData } from '../../../navigation/notificationTarget';
import { formatTimeAgo } from '../../../utils/format';
import { NotificationRow } from '../NotificationsScreen';
import type { NotificationDto } from '../../../api/types';

describe('notificationTarget', () => {
  it('routes club payloads to the room and board payloads to the leaderboard', () => {
    expect(notificationTarget({ clubId: '12345678', type: 'GiftReceived' })).toEqual({ screen: 'ClubRoom', params: { publicId: '12345678' } });
    expect(notificationTarget({ board: 'TopGifters', rank: '1' })).toEqual({ screen: 'Leaderboard' });
    expect(notificationTarget({ type: 'System' })).toEqual({ screen: 'Notifications' });
    expect(notificationTarget(null)).toEqual({ screen: 'Notifications' });
  });

  it('parses stored JSON leniently', () => {
    expect(parseNotificationData('{"clubId":"1"}')).toEqual({ clubId: '1' });
    expect(parseNotificationData('not json')).toBeNull();
    expect(parseNotificationData('[1]')).toBeNull();
    expect(parseNotificationData(null)).toBeNull();
  });
});

describe('formatTimeAgo', () => {
  it('scales from minutes to days', () => {
    const now = new Date('2026-09-16T12:00:00Z').getTime();
    expect(formatTimeAgo('2026-09-16T11:59:40Z', now)).toBe('just now');
    expect(formatTimeAgo('2026-09-16T11:55:00Z', now)).toBe('5 min ago');
    expect(formatTimeAgo('2026-09-16T09:00:00Z', now)).toBe('3 hrs ago');
    expect(formatTimeAgo('2026-09-14T12:00:00Z', now)).toBe('2 days ago');
  });
});

describe('NotificationRow', () => {
  const item: NotificationDto = {
    id: 7,
    type: 'GiftReceived',
    title: 'Fan sent you Rose ×5',
    body: 'You received 50 hearts in Gift club.',
    dataJson: '{"clubId":"12345678"}',
    isRead: false,
    createdAt: '2026-09-16T11:55:00Z',
  };

  it('marks unread rows and reports taps', async () => {
    const onPress = jest.fn();
    await render(<NotificationRow item={item} now={new Date('2026-09-16T12:00:00Z').getTime()} onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText('Unread: Fan sent you Rose ×5'));
    expect(onPress).toHaveBeenCalledWith(item);
    expect(screen.getByText('5 min ago')).toBeTruthy();
  });
});
