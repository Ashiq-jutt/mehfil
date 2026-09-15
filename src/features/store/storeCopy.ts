import type { StoreItemKind } from '../../api/types';

const KIND_LABELS: Record<StoreItemKind, string> = {
  Frame: 'Frame',
  ChatBubble: 'Chat Bubble',
  EntryStyle: 'Entry Style',
  Background: 'Background',
  Card: 'Card',
  ClubDp: 'Club DP',
};

export function kindLabel(kind: StoreItemKind): string {
  return KIND_LABELS[kind] ?? kind;
}
