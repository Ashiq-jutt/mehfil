import React, { memo, useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, Button, CloseButton, EmptyState, ErrorState, Icon, IconName, Screen } from '../../components';
import { useMarkAllRead, useMarkRead, useNotifications } from '../../hooks/useNotifications';
import { useNow } from '../../hooks/useNow';
import { notificationTarget, parseNotificationData } from '../../navigation/notificationTarget';
import type { MainStackScreenProps } from '../../navigation/types';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { NotificationsSkeleton } from './NotificationsSkeleton';
import { formatTimeAgo } from '../../utils/format';
import type { NotificationDto, NotificationType } from '../../api/types';

const ICONS: Record<NotificationType, { icon: IconName; color: string }> = {
  GiftReceived: { icon: 'gift', color: colors.hearts },
  ClubFollowed: { icon: 'heart', color: colors.hearts },
  LeaderboardReward: { icon: 'trophy', color: colors.accent },
  AdminGranted: { icon: 'check', color: colors.primary },
  ClubInvite: { icon: 'user', color: colors.info },
  Kicked: { icon: 'alert', color: colors.danger },
  Banned: { icon: 'alert', color: colors.danger },
  System: { icon: 'info', color: colors.info },
};

/** Notification inbox: newest first, unread rows highlighted, tap opens the club / leaderboard it refers to. */
export function NotificationsScreen({ navigation }: MainStackScreenProps<'Notifications'>) {
  const query = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const now = useNow(60_000);
  const items = query.data?.pages.flatMap(p => p.notifications.items) ?? [];
  const unread = query.data?.pages[0]?.unreadCount ?? 0;

  const onPress = useCallback(
    (item: NotificationDto) => {
      if (!item.isRead) {
        markRead.mutate(item.id);
      }
      const target = notificationTarget(parseNotificationData(item.dataJson));
      if (target.screen === 'ClubRoom') {
        navigation.navigate('ClubRoom', target.params);
      } else if (target.screen === 'Leaderboard') {
        navigation.navigate('Leaderboard');
      }
    },
    [markRead, navigation],
  );

  return (
    <Screen variant="flat">
      <View style={styles.topBar}>
        <AppText variant="title" color="textGold" shadow>
          Notifications
        </AppText>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>
      {unread > 0 ? (
        <Button label={`Mark all ${unread} as read`} variant="ghost" loading={markAll.isPending} onPress={() => markAll.mutate()} style={styles.markAll} />
      ) : null}

      {query.isLoading && !query.data ? <NotificationsSkeleton /> : null}
      {query.error && !query.data ? <ErrorState title="Could not load notifications" actionLabel="Retry" onAction={() => query.refetch()} /> : null}

      {query.data ? (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <NotificationRow item={item} now={now} onPress={onPress} />}
          ItemSeparatorComponent={Gap}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="info" title="Nothing yet" message="Gifts, new followers and leaderboard wins show up here." />}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => {
                query.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        />
      ) : null}
    </Screen>
  );
}

export const NotificationRow = memo(function NotificationRowItem({
  item,
  now,
  onPress,
}: {
  item: NotificationDto;
  now: number;
  onPress: (item: NotificationDto) => void;
}) {
  const { icon, color } = ICONS[item.type] ?? ICONS.System;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? '' : 'Unread: '}${item.title}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.row, item.isRead ? null : styles.rowUnread, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.iconBubble, { borderColor: color }]}>
        <Icon name={icon} size={moderateScale(18)} color={color} />
      </View>
      <View style={styles.text}>
        <AppText variant="label" numberOfLines={2}>
          {item.title}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={3}>
          {item.body}
        </AppText>
        <AppText variant="tiny" color="textMuted">
          {formatTimeAgo(item.createdAt, now)}
        </AppText>
      </View>
      {!item.isRead ? <View style={styles.dot} /> : null}
    </Pressable>
  );
});

function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  markAll: {
    alignSelf: 'flex-end',
    marginRight: spacing.sm,
    height: moderateScale(32),
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  gap: {
    height: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowUnread: {
    backgroundColor: colors.panelRaised,
    borderColor: colors.borderMagenta,
  },
  iconBubble: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  dot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: colors.hearts,
  },
});
