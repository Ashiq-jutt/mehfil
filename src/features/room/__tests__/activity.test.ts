import { roomActivity, sessionGiftCount } from '../activity';
import type { FeedItem } from '../../../store/roomStore';
import type { RoomUserDto } from '../../../api/types';

const sender: RoomUserDto = {
  id: 'MOBI4875',
  displayName: 'Fan',
  level: 3,
  role: 'Member',
  gender: 'Male',
  royalLevel: 'None',
  micEnabled: false,
  isSpeaking: false,
};

const feed: FeedItem[] = [
  { kind: 'system', id: 's1', text: 'Fan entered the room', createdAt: '2026-09-16T10:00:00Z' },
  { kind: 'message', id: 'm1', message: { id: 1, type: 'Text', text: 'hello', sender, createdAt: '2026-09-16T10:01:00Z' } },
  { kind: 'message', id: 'm2', message: { id: 2, type: 'Gift', text: 'Fan sent Rose ×5 to Anaya', sender, createdAt: '2026-09-16T10:02:00Z', giftTransactionId: 7 } },
  { kind: 'message', id: 'm3', message: { id: 3, type: 'Gift', text: 'Fan sent Castle ×1 to the club', sender, createdAt: '2026-09-16T10:03:00Z', giftTransactionId: 8 } },
];

describe('roomActivity', () => {
  it('keeps gifts and room events, drops ordinary chat, newest first', () => {
    const items = roomActivity(feed);

    expect(items.map(i => i.id)).toEqual(['m3', 'm2', 's1']);
    expect(items[0].kind).toBe('gift');
    expect(items[2].kind).toBe('room');
    expect(items.some(i => i.text === 'hello')).toBe(false);
  });

  it('honours the limit and returns an empty list for an empty feed', () => {
    expect(roomActivity(feed, 2)).toHaveLength(2);
    expect(roomActivity([])).toEqual([]);
  });

  it('counts the gifts seen this session', () => {
    expect(sessionGiftCount(feed)).toBe(2);
    expect(sessionGiftCount([])).toBe(0);
  });
});
