import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AppText, Icon } from '../../components';
import { colors, gradients, moderateScale, radius, shadows, spacing, typography } from '../../theme';
import { formatCompact } from '../../utils/format';

type RailProps = {
  totalHearts: number;
  onPressTrophy: () => void;
  onPressJar: () => void;
  onPressOffer: () => void;
  onPressActivity: () => void;
};

/** Right-hand rail: trophy (club hearts), jar, offer countdown, activity. */
export function RoomRightRail({ totalHearts, onPressTrophy, onPressJar, onPressOffer, onPressActivity }: RailProps) {
  return (
    <View pointerEvents="box-none" style={styles.rail}>
      <Pressable accessibilityRole="button" accessibilityLabel="Club hearts" onPress={onPressTrophy} style={styles.railItem}>
        <Icon name="trophy" size={moderateScale(30)} color={colors.accent} />
        <View style={styles.railBadge}>
          <AppText variant="tiny">♥ {formatCompact(totalHearts)}</AppText>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Club jar" onPress={onPressJar} style={styles.railItem}>
        <View style={styles.jar}>
          <Icon name="heart" size={moderateScale(16)} color={colors.hearts} />
        </View>
      </Pressable>
      <View style={styles.railSpacer} />
      <Pressable accessibilityRole="button" accessibilityLabel="Offer" onPress={onPressOffer} style={styles.railItem}>
        <View style={styles.offerTag}>
          <AppText variant="tiny" color="textOnGold">
            OFFER!
          </AppText>
        </View>
        <Icon name="gift" size={moderateScale(24)} color={colors.hearts} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Activity" onPress={onPressActivity} style={styles.railItem}>
        <Icon name="fire" size={moderateScale(24)} color={colors.accent} />
        <View style={[styles.offerTag, styles.activityTag]}>
          <AppText variant="tiny">ACTIVITY</AppText>
        </View>
      </Pressable>
    </View>
  );
}

type BarProps = {
  micEnabled: boolean;
  canUseMic: boolean;
  speakerOn: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onSend: (text: string) => Promise<boolean>;
  onPressGift: () => void;
};

/** Bottom bar: speaker · mic · "Tap here to type…" · send · gift. */
export function RoomBottomBar({ micEnabled, canUseMic, speakerOn, onToggleMic, onToggleSpeaker, onSend, onPressGift }: BarProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim() || sending) {
      return;
    }
    setSending(true);
    const ok = await onSend(text);
    setSending(false);
    if (ok) {
      setText('');
    }
  };

  return (
    <View style={styles.bar}>
      <RoundToggle icon="mic" active={speakerOn} onPress={onToggleSpeaker} label="Speaker" iconOverride={speakerOn ? 'mic' : 'micOff'} />
      <RoundToggle icon={micEnabled ? 'mic' : 'micOff'} active={micEnabled} disabled={!canUseMic} onPress={onToggleMic} label="Microphone" />
      <View style={styles.inputWrap}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tap here to type..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={send}
          blurOnSubmit={false}
        />
        {text.trim() ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={send} hitSlop={6} style={styles.send}>
            <Icon name="chevronRight" size={moderateScale(18)} color={colors.white} strokeWidth={3} />
          </Pressable>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Send gift" onPress={onPressGift} style={styles.giftShell}>
        <LinearGradient colors={[colors.hearts, colors.danger]} style={styles.gift}>
          <Icon name="gift" size={moderateScale(24)} color={colors.white} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function RoundToggle({
  icon,
  iconOverride,
  active,
  disabled,
  onPress,
  label,
}: {
  icon: 'mic' | 'micOff';
  iconOverride?: 'mic' | 'micOff';
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.toggle, active ? styles.toggleActive : null, { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}>
      <Icon name={iconOverride ?? icon} size={moderateScale(18)} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
    width: moderateScale(56),
  },
  railItem: {
    alignItems: 'center',
    gap: 2,
  },
  railBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
  },
  jar: {
    width: moderateScale(34),
    height: moderateScale(38),
    borderRadius: radius.sm,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railSpacer: {
    flex: 1,
  },
  offerTag: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
  },
  activityTag: {
    backgroundColor: colors.danger,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(8, 3, 20, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primary,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: moderateScale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  send: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftShell: {
    ...shadows.button,
  },
  gift: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});

export const railGradients = gradients;
