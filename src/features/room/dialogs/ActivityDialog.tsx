import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, DialogCard, EmptyState, Icon } from '../../../components';
import { useNow } from '../../../hooks/useNow';
import { colors, moderateScale, radius, spacing } from '../../../theme';
import { resolveAssetUrl } from '../../../utils/assets';
import { formatCompact, formatTimeAgo } from '../../../utils/format';
import { roomActivity, sessionGiftCount } from '../activity';
import type { FeedItem } from '../../../store/roomStore';

type Props = { visible: boolean; onClose: () => void; feed: FeedItem[]; totalHearts: number; onlineCount: number };

/** "Activity" rail: what has been happening in this room — gifts, arrivals and moderation events. */
export function ActivityDialog({ visible, onClose, feed, totalHearts, onlineCount }: Props) {
  const now = useNow(30_000);
  const items = roomActivity(feed);
  const gifts = sessionGiftCount(feed);

  return (
    <DialogCard visible={visible} title="Room activity" onClose={onClose}>
      <View style={styles.stats}>
        <Stat label="Club hearts" value={`♥ ${formatCompact(totalHearts)}`} />
        <Stat label="In the room" value={String(onlineCount)} />
        <Stat label="Gifts seen" value={String(gifts)} />
      </View>

      <View style={styles.list}>
        {items.length === 0 ? (
          <EmptyState icon="fire" title="Quiet so far" message="Gifts and arrivals show up here while you are in the room." style={styles.empty} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={Gap}
            renderItem={({ item }) => (
              <View style={styles.row}>
                {item.kind === 'gift' ? (
                  <View style={styles.giftBubble}>
                    <Icon name="gift" size={moderateScale(16)} color={colors.hearts} />
                  </View>
                ) : (
                  <AvatarRing uri={resolveAssetUrl(item.user?.avatarUrl)} size={moderateScale(30)} ring="none" />
                )}
                <View style={styles.text}>
                  <AppText variant="caption" numberOfLines={2}>
                    {item.text}
                  </AppText>
                  <AppText variant="tiny" color="textMuted">
                    {formatTimeAgo(item.createdAt, now)}
                  </AppText>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </DialogCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="label" shadow>
        {value}
      </AppText>
      <AppText variant="tiny" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  list: {
    maxHeight: moderateScale(320),
  },
  empty: {
    minHeight: moderateScale(160),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  giftBubble: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  gap: {
    height: spacing.sm,
  },
});
