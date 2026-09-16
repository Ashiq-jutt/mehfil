import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  AppText,
  AvatarRing,
  Button,
  CloseButton,
  DialogCard,
  ErrorState,
  HeartsPill,
  Icon,
  IconButton,
  LoadingState,
  Panel,
  Screen,
  SectionRibbon,
} from '../../components';
import { AchievementBadge } from '../../components/badges/AchievementBadge';
import { RoyalBadge } from '../../components/badges/RoyalBadge';
import { useProfile, useUpdateProfile, useUploadAvatar } from '../../hooks/useProfile';
import type { MainStackParamList } from '../../navigation/types';
import { toast } from '../../store/toastStore';
import { colors, moderateScale } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import { formatBirthday, formatCompact, formatHours } from '../../utils/format';
import { pickAvatarImage } from '../../utils/pickImage';
import { CountryPickerDialog } from '../shared/CountryPickerDialog';
import { BirthdayDialog } from './dialogs/BirthdayDialog';
import { EditNameDialog } from './dialogs/EditNameDialog';
import { GenderDialog } from './dialogs/GenderDialog';
import { PlayerCardDialog } from './PlayerCardDialog';
import { RoyaltySheet } from './RoyaltySheet';
import { styles } from './ProfileScreen.styles';

type Dialog = 'name' | 'country' | 'gender' | 'birthday' | 'avatar' | 'card' | 'royalty' | null;

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data, isLoading, error, refetch, isRefetching } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [dialog, setDialog] = useState<Dialog>(null);

  const close = () => setDialog(null);

  const copyId = () => {
    if (!data) {
      return;
    }
    Clipboard.setString(data.user.id);
    toast.success('ID has been copied');
  };

  const changePhoto = async () => {
    close();
    try {
      const file = await pickAvatarImage();
      if (file) {
        uploadAvatar.mutate(file);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not pick a photo.');
    }
  };

  return (
    <Screen variant="flat" edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <IconButton icon="gift" accessibilityLabel="Inbox" onPress={() => toast.info('Inbox arrives in phase 11.')} />
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      {isLoading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState title="Could not load profile" actionLabel="Retry" onAction={() => refetch()} /> : null}

      {data ? (
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
          {/* Split background: dark upper band, gold seam at avatar centre, light violet below. */}
          <View style={styles.upperBand} />
          <View style={styles.seam} />

          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Change photo or view card" onPress={() => setDialog('avatar')}>
              <AvatarRing uri={resolveAssetUrl(data.user.avatarUrl)} size={moderateScale(96)} />
              {uploadAvatar.isPending ? (
                <View style={styles.avatarBusy}>
                  <LoadingState />
                </View>
              ) : null}
            </Pressable>

            <Pressable accessibilityRole="button" onPress={() => setDialog('name')} style={styles.nameRow}>
              <AppText variant="title" shadow numberOfLines={1}>
                {data.user.displayName}
              </AppText>
              <Icon name="gear" size={moderateScale(14)} color={colors.textMuted} />
            </Pressable>
            {data.user.signature ? (
              <AppText variant="caption" color="textSecondary" align="center" numberOfLines={2} style={styles.signature}>
                {data.user.signature}
              </AppText>
            ) : null}

            <View style={styles.badgeRow}>
              <BadgeChip label={data.flagEmoji ?? '🌐'} onPress={() => setDialog('country')} />
              <BadgeChip label={`ID: ${data.user.id}`} icon="copy" onPress={copyId} />
              <BadgeChip
                label={data.user.genderLocked ? data.user.gender.toUpperCase() : 'Gender'}
                icon={data.user.genderLocked ? 'user' : 'plus'}
                onPress={() => (data.user.genderLocked ? toast.info('Gender can be updated only once.') : setDialog('gender'))}
              />
              <BadgeChip label={formatBirthday(data.user.birthDay, data.user.birthMonth) ?? 'Birthday'} emoji="🎂" onPress={() => setDialog('birthday')} />
            </View>

            <View style={styles.heartsRow}>
              <HeartsPill value={data.user.heartsBalance} />
              <View style={styles.viewsPill}>
                <AppText variant="tiny" color="textSecondary">
                  {formatCompact(data.stats.profileViews)} views
                </AppText>
              </View>
            </View>
          </View>

          <SectionRibbon label="Achievements" style={styles.ribbon} />

          <Pressable accessibilityRole="button" onPress={() => setDialog('royalty')}>
            <Panel variant="tile" style={styles.tile}>
              <View style={styles.columns}>
                <StatColumn label="Current">
                  <RoyalBadge level={data.user.royalLevel} locked={data.user.royalLevel === 'None'} size={moderateScale(56)} />
                </StatColumn>
                <Divider />
                <StatColumn label="Highest Royalty">
                  <RoyalBadge level={data.user.highestRoyalLevel} locked={data.user.highestRoyalLevel === 'None'} size={moderateScale(56)} />
                </StatColumn>
                <Divider />
                <StatColumn label="Royal Streak">
                  <View style={styles.streak}>
                    <Icon name="fire" size={moderateScale(20)} color={colors.accent} />
                    <AppText variant="title">{data.user.royalStreakMonths}</AppText>
                  </View>
                  <AppText variant="caption" color="textSecondary">
                    Months
                  </AppText>
                </StatColumn>
              </View>
            </Panel>
          </Pressable>

          <View style={styles.tileRow}>
            <AchievementTile label="Celebrity of the Month" kind="celebrity" count={data.achievements.celebrityOfTheMonthTimes} />
            <AchievementTile label="Top Gifter" kind="topGifter" count={data.achievements.topGifterTimes} />
            <AchievementTile label="Top Receiver" kind="topReceiver" count={data.achievements.topReceiverTimes} />
          </View>

          <SectionRibbon label="Mehfil Stats" style={styles.ribbon} />

          <Panel variant="tile" style={styles.tile}>
            <View style={styles.columns}>
              <StatColumn label="Level">
                <AppText variant="display">{data.stats.level}</AppText>
              </StatColumn>
              <Divider />
              <StatColumn label="Hours Active">
                <AppText variant="display">{formatHours(data.stats.activeSeconds)}</AppText>
              </StatColumn>
              <Divider />
              <StatColumn label="Clubs Followed">
                <AppText variant="display">{data.stats.clubsFollowed}</AppText>
              </StatColumn>
            </View>
          </Panel>
        </ScrollView>
      ) : null}

      {data ? (
        <>
          <EditNameDialog visible={dialog === 'name'} onClose={close} displayName={data.user.displayName} signature={data.user.signature} />
          <CountryPickerDialog
            visible={dialog === 'country'}
            onClose={close}
            selectedCode={data.user.countryCode}
            onSelect={country => {
              close();
              updateProfile.mutate({ countryCode: country.code });
            }}
          />
          <GenderDialog visible={dialog === 'gender'} onClose={close} />
          <BirthdayDialog visible={dialog === 'birthday'} onClose={close} initialDay={data.user.birthDay} initialMonth={data.user.birthMonth} />
          <PlayerCardDialog visible={dialog === 'card'} onClose={close} publicId="me" />
          <RoyaltySheet visible={dialog === 'royalty'} onClose={close} />
          <DialogCard visible={dialog === 'avatar'} title="Profile photo" onClose={close}>
            <Button label="View player card" variant="secondary" icon="user" onPress={() => setDialog('card')} style={styles.avatarAction} />
            <Button label="Change photo" icon="plus" onPress={changePhoto} />
          </DialogCard>
        </>
      ) : null}
    </Screen>
  );
}

function BadgeChip({ label, icon, emoji, onPress }: { label: string; icon?: 'copy' | 'plus' | 'user'; emoji?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.8 : 1 }]}>
      {emoji ? <AppText variant="caption">{emoji}</AppText> : null}
      {icon === 'plus' ? <Icon name="plus" size={moderateScale(11)} color={colors.textSecondary} /> : null}
      <AppText variant="caption" numberOfLines={1}>
        {label}
      </AppText>
      {icon === 'copy' ? <Icon name="copy" size={moderateScale(12)} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

function StatColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.column}>
      <AppText variant="label" color="textPrimary" shadow align="center">
        {label}
      </AppText>
      <View style={styles.columnBody}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function AchievementTile({ label, kind, count }: { label: string; kind: 'celebrity' | 'topGifter' | 'topReceiver'; count: number }) {
  return (
    <Panel variant="tile" padded={false} style={styles.achievementTile}>
      <View style={styles.achievementBody}>
        <AppText variant="tiny" shadow align="center" numberOfLines={2}>
          {label}
        </AppText>
        <View style={styles.achievementRow}>
          <AchievementBadge kind={kind} size={moderateScale(40)} />
          <View>
            <AppText variant="title">{count}</AppText>
            <AppText variant="tiny" color="textSecondary">
              Times
            </AppText>
          </View>
        </View>
      </View>
    </Panel>
  );
}
