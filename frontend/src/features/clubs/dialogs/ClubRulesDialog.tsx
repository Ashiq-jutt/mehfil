import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, DialogCard, LoadingState, PillTabs } from '../../../components';
import { useClubRules } from '../../../hooks/useCatalog';
import { colors, moderateScale, radius, spacing } from '../../../theme';
import { formatCompact } from '../../../utils/format';
import type { ClubDetailDto } from '../../../api/types';

const TABS = [
  { key: 'info', label: 'INFO' },
  { key: 'rules', label: 'RULES' },
];

type Props = { visible: boolean; onClose: () => void; club: ClubDetailDto };

/** INFO / RULES toggle: club facts on one side, the community rules with gold bullets on the other. */
export function ClubRulesDialog({ visible, onClose, club }: Props) {
  const [tab, setTab] = useState('rules');
  const rules = useClubRules(visible);

  return (
    <DialogCard visible={visible} onClose={onClose}>
      <PillTabs items={TABS} activeKey={tab} onChange={setTab} style={styles.tabs} />

      {tab === 'rules' ? (
        <View>
          <AppText variant="heading" align="center" shadow style={styles.title}>
            CLUBS RULES
          </AppText>
          {rules.isLoading ? <LoadingState /> : null}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {(rules.data ?? []).map(rule => (
              <View key={rule.title} style={styles.rule}>
                <View style={styles.bullet} />
                <AppText variant="body" style={styles.ruleText}>
                  <AppText variant="bodyStrong">{rule.title} : </AppText>
                  {rule.text}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.infoList}>
          <InfoRow label="Club" value={club.name} />
          <InfoRow label="ID" value={club.id} />
          <InfoRow label="Owner" value={club.owner.displayName} />
          <InfoRow label="Category" value={club.categoryName} />
          <InfoRow label="Language" value={club.language} />
          <InfoRow label="Country" value={club.countryName ? `${club.flagEmoji} ${club.countryName}` : 'Global'} />
          <InfoRow label="Level" value={String(club.level)} />
          <InfoRow label="Members" value={formatCompact(club.memberCount)} />
          <InfoRow label="Followers" value={formatCompact(club.followerCount)} />
          <InfoRow label="Created" value={new Date(club.createdAt).toLocaleDateString()} />
        </View>
      )}
    </DialogCard>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="label" numberOfLines={1} style={styles.infoValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  scroll: {
    maxHeight: moderateScale(360),
  },
  rule: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  ruleText: {
    flex: 1,
  },
  infoList: {
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
