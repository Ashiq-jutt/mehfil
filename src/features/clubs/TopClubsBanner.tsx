import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText } from '../../components';
import type { MainStackParamList } from '../../navigation/types';
import { colors, moderateScale, palette, radius, shadows, spacing } from '../../theme';
import { formatCompact } from '../../utils/format';
import { ClubCover } from './ClubCover';
import type { ClubCardDto } from '../../api/types';

type Props = { clubs: ClubCardDto[] };

/** "TOP CLUBS" podium banner (2 · 1 · 3) shown in the banner slot when there are ranked clubs. */
export function TopClubsBanner({ clubs }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [first, second, third] = clubs;
  const podium = [
    { club: second, rank: 2, height: moderateScale(58) },
    { club: first, rank: 1, height: moderateScale(72) },
    { club: third, rank: 3, height: moderateScale(52) },
  ];

  return (
    <LinearGradient colors={[palette.plum300, palette.plum700]} style={styles.card}>
      <View style={styles.titleRibbon}>
        <AppText variant="tiny" color="textOnGold">
          TOP CLUBS
        </AppText>
      </View>
      <View style={styles.podium}>
        {podium.map(({ club, rank, height }) =>
          club ? (
            <Pressable
              key={rank}
              accessibilityRole="button"
              onPress={() => navigation.navigate('ClubInfo', { publicId: club.id })}
              style={[styles.slot, rank === 1 ? styles.slotFirst : null]}>
              <View style={[styles.cover, { width: height, height }]}>
                <ClubCover uri={club.coverUrl} name={club.name} radius={radius.sm} />
              </View>
              <View style={[styles.rankBadge, rank === 1 ? styles.rankGold : null]}>
                <AppText variant="tiny" color={rank === 1 ? 'textOnGold' : 'textPrimary'}>
                  {rank}
                </AppText>
              </View>
              <AppText variant="tiny" numberOfLines={1} style={styles.name}>
                {club.name}
              </AppText>
              <AppText variant="tiny" color="textGold">
                ♥ {formatCompact(club.totalHearts)}
              </AppText>
            </Pressable>
          ) : (
            <View key={rank} style={styles.slot} />
          ),
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: moderateScale(120),
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.gold500,
    paddingTop: spacing.lg,
    ...shadows.card,
  },
  titleRibbon: {
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
    backgroundColor: palette.gold500,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderBottomLeftRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  podium: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  slot: {
    width: moderateScale(84),
    alignItems: 'center',
  },
  slotFirst: {
    marginBottom: spacing.xs,
  },
  cover: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  rankBadge: {
    marginTop: -moderateScale(9),
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: colors.tileRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  rankGold: {
    backgroundColor: palette.gold400,
  },
  name: {
    maxWidth: '100%',
  },
});
