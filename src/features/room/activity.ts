import type { FeedItem } from '../../store/roomStore';
import type { RoomUserDto } from '../../api/types';

export type ActivityItem = {
  id: string;
  kind: 'gift' | 'room';
  text: string;
  user?: RoomUserDto | null;
  createdAt: string;
};

/**
 * Recent room activity derived from the live feed: gifts first-class, joins and other system
 * events alongside them. Newest first. Pure so the Activity panel can be tested without a hub.
 */
export function roomActivity(feed: FeedItem[], limit = 40): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const item of feed) {
    if (item.kind === 'message') {
      if (item.message.type === 'Gift') {
        items.push({ id: item.id, kind: 'gift', text: item.message.text, user: item.message.sender, createdAt: item.message.createdAt });
      }
    } else {
      items.push({ id: item.id, kind: 'room', text: item.text, createdAt: item.createdAt });
    }
  }

  return items.reverse().slice(0, limit);
}

/** Hearts gifted in the room since this session joined, from the same feed. */
export function sessionGiftCount(feed: FeedItem[]): number {
  return feed.reduce((count, item) => (item.kind === 'message' && item.message.type === 'Gift' ? count + 1 : count), 0);
}
