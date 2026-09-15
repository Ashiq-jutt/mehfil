import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, Button, DialogCard, ErrorState, LoadingState, SectionRibbon } from '../../components';
import { RoyalBadge } from '../../components/badges/RoyalBadge';
import { useBlockedIds, useBlockUser, useUnblockUser } from '../../hooks/useBlocks';
import { useProfile } from '../../hooks/useProfile';
import { usePublicProfile } from '../../hooks/useRoyalty';
import { useAuthStore } from '../../store/authStore';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { formatCompact, formatHours } from '../../utils/format';
import { ReportDialog } from '../shared/ReportDialog';
import type { AchievementsDto, PrimeLevel, RoyalLevel, StatsDto } from '../../api/types';

type CardModel = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  signature?: string | null;
  flagEmoji?: string | null;
  countryName?: string | null;
  level: number;
  heartsReceived: number;
  heartsGifted: number;
  heartsBalance?: number;
  royalLevel: RoyalLevel;
  primeLevel: PrimeLevel;
  achievements: AchievementsDto;
  stats: StatsDto;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Public id of another user, or "me" for the signed-in user's own card. */
  publicId: string | 'me' | null;
};

/** The player card modal (tap on an avatar anywhere in the app). */
export function PlayerCardDialog({ visible, onClose, publicId }: Props) {
  const myId = useAuthStore(s => s.user?.id);
  const isMe = publicId === 'me' || (!!publicId && publicId === myId);
  const me = useProfile();
  const other = usePublicProfile(visible && publicId && !isMe ? publicId : null);
  const [report, setReport] = useState(false);
  const blockedIds = useBlockedIds();
  const block = useBlockUser();
  const unblock = useUnblockUser();

  const model: CardModel | null = isMe
    ? me.data
      ? {
          ...me.data.user,
          flagEmoji: me.data.flagEmoji,
          countryName: me.data.countryName,
          achievements: me.data.achievements,
          stats: me.data.stats,
        }
      : null
    : other.data ?? null;

  const loading = isMe ? me.isLoading : other.isLoading;
  const error = isMe ? me.error : other.error;

  return (
    <DialogCard visible={visible} onClose={onClose}>
      {loading && !model ? <LoadingState /> : null}
      {error && !model ? <ErrorState title="Could not load player" message={String((error as Error).message)} /> : null}
      {model ? (
        <CardBody
          model={model}
          isMe={isMe}
          isBlocked={blockedIds.has(model.id)}
          blockBusy={block.isPending || unblock.isPending}
          onReport={() => setReport(true)}
          onToggleBlock={() => (blockedIds.has(model.id) ? unblock.mutate(model.id) : block.mutate(model.id))}
        />
      ) : null}
      {model && !isMe ? (
        <ReportDialog visible={report} onClose={() => setReport(false)} targetType="User" targetId={model.id} targetLabel={`User · ${model.displayName}`} />
      ) : null}
    </DialogCard>
  );
}

function CardBody({
  model,
  isMe,
  isBlocked,
  blockBusy,
  onReport,
  onToggleBlock,
}: {
  model: CardModel;
  isMe: boolean;
  isBlocked: boolean;
  blockBusy: boolean;
  onReport: () => void;
  onToggleBlock: () => void;
}) {
  const royalty = model.primeLevel !== 'None' ? model.primeLevel : model.royalLevel !== 'None' ? model.royalLevel : null;

  return (
    <View>
      <View style={styles.header}>
        <AvatarRing uri={resolveAssetUrl(model.avatarUrl)} size={moderateScale(64)} />
        <View style={styles.namePill}>
          <AppText variant="heading" numberOfLines={1}>
            {model.displayName}
          </AppText>
        </View>
        {royalty ? <RoyalBadge level={royalty} size={moderateScale(44)} /> : null}
      </View>

      {model.flagEmoji ? (
        <AppText variant="label" color="textSecondary" align="center" style={styles.country}>
          {model.flagEmoji} {model.countryName?.toUpperCase()}
        </AppText>
      ) : null}

      <View style={styles.grid}>
        <Field label="Level" value={String(model.level)} />
        <Field label="Signature" value={model.signature || '—'} />
        <Field label="Hearts received" value={formatCompact(model.heartsReceived)} />
        <Field label={isMe ? 'Hearts balance' : 'Hearts gifted'} value={formatCompact(isMe ? model.heartsBalance ?? 0 : model.heartsGifted)} />
        <Field label="Player ID" value={model.id} />
        <Field label="Royalty" value={royalty ?? '—'} />
      </View>

      <SectionRibbon label="STATS" style={styles.ribbon} />

      <View style={styles.grid}>
        <Field label="Clubs followed" value={String(model.stats.clubsFollowed)} />
        <Field label="Clubs joined" value={String(model.stats.clubsJoined)} />
        <Field label="Gifts sent" value={formatCompact(model.stats.giftsSent)} />
        <Field label="Gifts received" value={formatCompact(model.stats.giftsReceived)} />
        <Field label="Hours active" value={formatHours(model.stats.activeSeconds)} />
        <Field label="Profile views" value={formatCompact(model.stats.profileViews)} />
        <Field label="Top gifter" value={`${model.achievements.topGifterTimes}×`} />
        <Field label="Top receiver" value={`${model.achievements.topReceiverTimes}×`} />
      </View>

      {!isMe ? (
        <View style={styles.moderation}>
          <Button label="Report user" variant="ghost" icon="alert" onPress={onReport} style={styles.report} />
          <Button label={isBlocked ? 'Unblock' : 'Block'} variant="ghost" icon="lock" loading={blockBusy} onPress={onToggleBlock} style={styles.report} />
        </View>
      ) : null}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <View style={styles.valueBox}>
        <AppText variant="label" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  namePill: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  country: {
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  field: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  valueBox: {
    backgroundColor: colors.input,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: 2,
  },
  ribbon: {
    marginVertical: spacing.sm,
  },
  moderation: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  report: {
    flex: 1,
    marginTop: spacing.sm,
  },
});
