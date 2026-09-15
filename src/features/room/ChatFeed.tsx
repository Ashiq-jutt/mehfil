import React, { memo, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing } from '../../components';
import type { FeedItem } from '../../store/roomStore';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import type { RoomUserDto } from '../../api/types';

type Props = {
  feed: FeedItem[];
  loadingHistory: boolean;
  onLoadOlder: () => void;
  onPressUser: (user: RoomUserDto) => void;
  onLongPressMessage?: (item: Extract<FeedItem, { kind: 'message' }>) => void;
};

/** Inverted chat list: newest at the bottom, older pages load when scrolling up. */
export function ChatFeed({ feed, loadingHistory, onLoadOlder, onPressUser, onLongPressMessage }: Props) {
  const data = useMemo(() => [...feed].reverse(), [feed]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) =>
      item.kind === 'system' ? (
        <SystemPill text={item.text} />
      ) : (
        <MessageRow item={item} onPressUser={onPressUser} onLongPress={onLongPressMessage} />
      ),
    [onPressUser, onLongPressMessage],
  );

  return (
    <FlatList
      data={data}
      inverted
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      onEndReached={onLoadOlder}
      onEndReachedThreshold={0.6}
      ListFooterComponent={loadingHistory ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : undefined}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const SystemPill = memo(function SystemPillItem({ text }: { text: string }) {
  return (
    <View style={styles.systemRow}>
      <View style={styles.systemPill}>
        <View style={styles.systemDot} />
        <AppText variant="caption" numberOfLines={2}>
          {text}
        </AppText>
      </View>
    </View>
  );
});

const MessageRow = memo(function MessageRowItem({
  item,
  onPressUser,
  onLongPress,
}: {
  item: Extract<FeedItem, { kind: 'message' }>;
  onPressUser: (user: RoomUserDto) => void;
  onLongPress?: (item: Extract<FeedItem, { kind: 'message' }>) => void;
}) {
  const sender = item.message.sender;
  return (
    <Pressable onLongPress={onLongPress ? () => onLongPress(item) : undefined} delayLongPress={400} style={styles.messageRow}>
      <Pressable accessibilityRole="button" disabled={!sender} onPress={() => sender && onPressUser(sender)}>
        <AvatarRing uri={resolveAssetUrl(sender?.avatarUrl)} size={moderateScale(30)} ring="none" />
      </Pressable>
      <View style={styles.messageBody}>
        <AppText variant="tiny" color="textSecondary" numberOfLines={1}>
          {sender?.displayName ?? 'System'}
          {sender?.role === 'Owner' ? '  👑' : sender?.role === 'Admin' ? '  ★' : ''}
        </AppText>
        <View style={styles.bubble}>
          <AppText variant="body">{item.message.text}</AppText>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  loader: {
    marginVertical: spacing.sm,
  },
  systemRow: {
    alignItems: 'flex-start',
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(124, 92, 170, 0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: '78%',
  },
  systemDot: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: colors.tileSoft,
    borderWidth: 1.5,
    borderColor: colors.borderGold,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    maxWidth: '82%',
  },
  messageBody: {
    flexShrink: 1,
    gap: 2,
  },
  bubble: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: radius.md,
    borderTopLeftRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
