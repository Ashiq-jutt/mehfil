import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, Icon } from '../../components';
import { colors, moderateScale, palette, radius, shadows, spacing } from '../../theme';

type Props = { onPress?: () => void };

/** Promo banner slot above the club grid. Real offers come from the Shop in phase 8. */
export function WelcomeOfferBanner({ onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shell, { opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient colors={[palette.violet600, palette.violet800]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.badge}>
          <AppText variant="tiny" shadow>
            Now or Never
          </AppText>
        </View>
        <View style={styles.textBlock}>
          <AppText variant="display" color="textGold" shadow>
            WELCOME
          </AppText>
          <AppText variant="display" color="textGold" shadow style={styles.offerLine}>
            OFFER!
          </AppText>
        </View>
        <View style={styles.heartsBlock}>
          <Icon name="heart" size={moderateScale(44)} color={colors.hearts} />
          <View style={styles.amount}>
            <AppText variant="heading" shadow>
              350
            </AppText>
          </View>
        </View>
        <View style={styles.valueTag}>
          <AppText variant="tiny" shadow>
            5X{'\n'}VALUE
          </AppText>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  card: {
    height: moderateScale(96),
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: palette.gold500,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  textBlock: {
    flex: 1,
    paddingTop: spacing.md,
  },
  offerLine: {
    marginTop: -6,
  },
  heartsBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    marginTop: -spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
  },
  valueTag: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.gold400,
  },
});
