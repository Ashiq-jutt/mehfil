import type { PillTabItem } from '../../components';
import type { LeaderboardBoard } from '../../api/types';

export const BOARD_TABS: PillTabItem[] = [
  { key: 'TopClubs', label: 'Top Clubs' },
  { key: 'TopGifters', label: 'Top Gifters' },
  { key: 'TopReceivers', label: 'Top Receivers' },
];

export const PERIOD_TABS: PillTabItem[] = [
  { key: 'Daily', label: 'Daily' },
  { key: 'Weekly', label: 'Weekly' },
];

export function boardLabel(board: LeaderboardBoard): string {
  return BOARD_TABS.find(t => t.key === board)?.label ?? board;
}

/** Middle column heading of the ranking table. */
export function subjectHeading(board: LeaderboardBoard): string {
  switch (board) {
    case 'TopClubs':
      return 'CLUB';
    case 'TopGifters':
      return 'GIFTER';
    default:
      return 'RECEIVER';
  }
}

/** Ranks past the visible table collapse to "200+" like the sticky "me" row in the design. */
export function formatRank(rank: number): string {
  return rank > 200 ? '200+' : String(rank);
}
