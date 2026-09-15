import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, View } from 'react-native';

import {
  AppText,
  AvatarRing,
  Button,
  CloseButton,
  ErrorState,
  Icon,
  IconButton,
  LoadingState,
  Panel,
  PillButton,
  PillTabs,
  Screen,
  SectionRibbon,
} from '../../components';
import { useClub, useFollowClub, useUploadClubCover } from '../../hooks/useClubs';
import type { MainStackScreenProps } from '../../navigation/types';
import { toast } from '../../store/toastStore';
import { colors, moderateScale, radius } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { formatCompact, formatHours } from '../../utils/format';
import { pickAvatarImage } from '../../utils/pickImage';
import { PlayerCardDialog } from '../profile/PlayerCardDialog';
import { ReportDialog } from '../shared/ReportDialog';
import { ClubCover } from './ClubCover';
import { AdminsDialog } from './dialogs/AdminsDialog';
import { ClubRulesDialog } from './dialogs/ClubRulesDialog';
import { styles } from './ClubInfoScreen.styles';

type Dialog = 'admins' | 'rules' | 'report' | null;

const TABS = [
  { key: 'highlights', label: 'Highlights' },
  { key: 'info', label: 'Info' },
];

/** Club Info page: cover, identity, follow/share, Highlights and Info tabs. Admin tools, rules and reports land in phase 5. */
export function ClubInfoScreen({ route, navigation }: MainStackScreenProps<'ClubInfo'>) {
  const { publicId } = route.params;
  const { data: club, isLoading, error, refetch, isRefetching } = useClub(publicId);
  const follow = useFollowClub();
  const uploadCover = useUploadClubCover(publicId);
  const [tab, setTab] = useState('info');
  const [card, setCard] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const canManage = club?.myRole === 'Owner' || club?.myRole === 'Admin';

  const share = () => {
    if (club) {
      Share.share({ message: `Join "${club.name}" on Mehfil — Club ID ${club.id}` }).catch(() => undefined);
    }
  };

  const changeCover = async () => {
    try {
      const file = await pickAvatarImage();
      if (file) {
        uploadCover.mutate(file);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not pick an image.');
    }
  };

  return (
    <Screen variant="flat">
      <View style={styles.topBar}>
        <View />
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      {isLoading && !club ? <LoadingState /> : null}
      {error && !club ? <ErrorState title="Club not found" message={error.message} actionLabel="Retry" onAction={() => refetch()} /> : null}

      {club ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.accent}
            />
          }>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" disabled={!canManage} onPress={changeCover} style={styles.coverWrap}>
              <ClubCover uri={club.coverUrl} name={club.name} radius={radius.lg} />
              {canManage ? (
                <View style={styles.coverEdit}>
                  <Icon name="plus" size={moderateScale(12)} color={colors.white} strokeWidth={3} />
                </View>
              ) : null}
              {uploadCover.isPending ? (
                <View style={styles.coverBusy}>
                  <LoadingState />
                </View>
              ) : null}
            </Pressable>

            <View style={styles.nameRow}>
              <View style={styles.levelBadge}>
                <AppText variant="tiny" color="textOnGold">
                  {club.level}
                </AppText>
              </View>
              <AppText variant="title" shadow numberOfLines={1}>
                {club.name}
              </AppText>
            </View>

            <View style={styles.metaRow}>
              {club.flagEmoji ? (
                <View style={styles.metaPill}>
                  <AppText variant="caption">
                    {club.flagEmoji} {club.countryName}
                  </AppText>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy club ID"
                onPress={() => {
                  Clipboard.setString(club.id);
                  toast.success('Club ID has been copied');
                }}
                style={styles.metaPill}>
                <AppText variant="caption">ID: {club.id}</AppText>
                <Icon name="copy" size={moderateScale(12)} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.actionRow}>
              {club.myRole !== 'Owner' ? (
                <IconButton
                  icon={club.isFollowing ? 'heart' : 'heartOutline'}
                  color={club.isFollowing ? colors.hearts : colors.textPrimary}
                  accessibilityLabel={club.isFollowing ? 'Unfollow' : 'Follow'}
                  onPress={() => follow.mutate({ publicId: club.id, follow: !club.isFollowing })}
                />
              ) : null}
              <IconButton icon="share" accessibilityLabel="Share" onPress={share} />
              {canManage ? (
                <IconButton icon="gear" accessibilityLabel="Edit club" onPress={() => navigation.navigate('CreateClub', { publicId: club.id })} />
              ) : null}
            </View>
          </View>

          <PillTabs items={TABS} activeKey={tab} onChange={setTab} style={styles.tabs} />

          {tab === 'highlights' ? (
            <View style={styles.section}>
              <SectionRibbon label="Records" style={styles.ribbon} />
              <View style={styles.recordRow}>
                <Panel variant="tile" style={styles.recordTile}>
                  <AppText variant="tiny" shadow align="center">
                    Weekly Top Club
                  </AppText>
                  <AppText variant="display" align="center">
                    {club.weeklyTopClubCount}
                  </AppText>
                  <AppText variant="tiny" color="textSecondary" align="center">
                    Times
                  </AppText>
                </Panel>
                <Panel variant="tile" style={styles.recordTile}>
                  <AppText variant="tiny" shadow align="center">
                    Highest Active Time
                  </AppText>
                  <AppText variant="display" align="center">
                    {formatHours(club.activeSeconds)}
                  </AppText>
                  <AppText variant="tiny" color="textSecondary" align="center">
                    Hours
                  </AppText>
                </Panel>
              </View>
              <View style={styles.recordRow}>
                <Panel variant="tile" style={styles.recordTile}>
                  <AppText variant="tiny" shadow align="center">
                    Hearts collected
                  </AppText>
                  <AppText variant="display" align="center">
                    {formatCompact(club.totalHearts)}
                  </AppText>
                </Panel>
                <Panel variant="tile" style={styles.recordTile}>
                  <AppText variant="tiny" shadow align="center">
                    Followers
                  </AppText>
                  <AppText variant="display" align="center">
                    {formatCompact(club.followerCount)}
                  </AppText>
                </Panel>
              </View>
              <AppText variant="caption" color="textMuted" align="center" style={styles.note}>
                Top gifter and receiver records arrive with leaderboards (phase 9).
              </AppText>
            </View>
          ) : (
            <View style={styles.section}>
              <Pressable accessibilityRole="button" onPress={() => setCard(club.owner.id)}>
                <Panel variant="magenta" style={styles.ownerCard}>
                  <View style={styles.ownerRow}>
                    <AvatarRing uri={resolveAssetUrl(club.owner.avatarUrl)} size={moderateScale(52)} />
                    <View style={styles.ownerText}>
                      <AppText variant="heading" numberOfLines={1}>
                        {club.owner.displayName}
                      </AppText>
                      <View style={styles.ownerTag}>
                        <AppText variant="tiny">👑 OWNER</AppText>
                      </View>
                    </View>
                  </View>
                </Panel>
              </Pressable>

              <Pressable accessibilityRole="button" onPress={() => setDialog('admins')}>
                <Panel variant="magenta" style={styles.adminCard}>
                  <View style={styles.ownerRow}>
                    <View style={styles.adminIcon}>
                      <Icon name="user" size={moderateScale(24)} color={colors.info} />
                    </View>
                    <View>
                      <AppText variant="heading">Admins</AppText>
                      <AppText variant="body">{club.adminCount}</AppText>
                    </View>
                  </View>
                </Panel>
              </Pressable>

              <Panel variant="dark" style={styles.announcement}>
                <AppText variant="body">{club.announcement || 'No announcement yet.'}</AppText>
                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <AppText variant="tiny">{club.language}</AppText>
                  </View>
                  <View style={[styles.tag, styles.tagAccent]}>
                    <AppText variant="tiny">{club.categoryName}</AppText>
                  </View>
                </View>
              </Panel>

              <View style={styles.smallActions}>
                <PillButton onPress={() => setDialog('rules')}>Rules</PillButton>
                <PillButton onPress={() => setDialog('report')}>
                  <View style={styles.reportInner}>
                    <Icon name="alert" size={moderateScale(14)} color={colors.textPrimary} />
                    <AppText variant="label">Report</AppText>
                  </View>
                </PillButton>
              </View>
            </View>
          )}
        </ScrollView>
      ) : null}

      {club ? (
        <View style={styles.footer}>
          <Button label="Enter club" size="lg" icon="mic" onPress={() => toast.info('The live room arrives in phase 6.')} />
        </View>
      ) : null}

      {club ? (
        <>
          <PlayerCardDialog visible={card !== null} onClose={() => setCard(null)} publicId={card} />
          <AdminsDialog
            visible={dialog === 'admins'}
            onClose={() => setDialog(null)}
            clubId={club.id}
            isOwner={club.myRole === 'Owner'}
            onPressMember={member => {
              setDialog(null);
              setCard(member.id);
            }}
          />
          <ClubRulesDialog visible={dialog === 'rules'} onClose={() => setDialog(null)} club={club} />
          <ReportDialog visible={dialog === 'report'} onClose={() => setDialog(null)} targetType="Club" targetId={club.id} targetLabel={`Club · ${club.name}`} />
        </>
      ) : null}
    </Screen>
  );
}
