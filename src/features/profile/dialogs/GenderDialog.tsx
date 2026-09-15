import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, DialogCard, Icon } from '../../../components';
import { GenderAvatar } from '../../../components/badges/GenderAvatar';
import { useSetGender } from '../../../hooks/useProfile';
import { colors, moderateScale, spacing } from '../../../theme';
import type { Gender } from '../../../api/types';

type Option = Exclude<Gender, 'Unspecified'>;
const OPTIONS: Option[] = ['Male', 'Female', 'Undisclosed'];

type Props = { visible: boolean; onClose: () => void };

/** "Personal info → Select your gender" with the one-time "Save Gender?" confirmation. */
export function GenderDialog({ visible, onClose }: Props) {
  const [selected, setSelected] = useState<Option | null>(null);
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const mutation = useSetGender();

  useEffect(() => {
    if (visible) {
      setSelected(null);
      setStep('pick');
    }
  }, [visible]);

  const save = () => {
    if (!selected) {
      return;
    }
    mutation.mutate(selected, { onSuccess: onClose });
  };

  if (step === 'confirm') {
    return (
      <DialogCard visible={visible} onClose={onClose} dismissOnBackdrop={false}>
        <View style={styles.warnTitle}>
          <Icon name="alert" size={moderateScale(22)} color={colors.accent} />
          <AppText variant="title" shadow>
            Save Gender?
          </AppText>
        </View>
        <View style={styles.warnBox}>
          <AppText variant="bodyStrong" align="center">
            Gender can be updated only once. Are you sure you want to proceed?
          </AppText>
        </View>
        <View style={styles.actions}>
          <Button label="Cancel" variant="danger" onPress={() => setStep('pick')} style={styles.action} />
          <Button label="Save" onPress={save} loading={mutation.isPending} style={styles.action} />
        </View>
      </DialogCard>
    );
  }

  return (
    <DialogCard visible={visible} title="Personal info" subtitle="Select your gender" onClose={onClose}>
      <View style={styles.options}>
        {OPTIONS.map(option => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setSelected(option)}
              style={styles.option}>
              <GenderAvatar gender={option} size={moderateScale(64)} dimmed={!!selected && !active} />
              <AppText variant="label" color={active ? 'textPrimary' : 'textMuted'}>
                {option}
              </AppText>
              <View style={[styles.radio, active ? styles.radioActive : null]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Button label="Confirm" disabled={!selected} onPress={() => setStep('confirm')} style={styles.confirm} />
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
  },
  option: {
    alignItems: 'center',
    gap: spacing.xs,
    width: moderateScale(90),
  },
  radio: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  radioActive: {
    borderColor: colors.hearts,
  },
  radioDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(5),
    backgroundColor: colors.hearts,
  },
  confirm: {
    alignSelf: 'center',
    minWidth: moderateScale(160),
    marginTop: spacing.sm,
  },
  warnTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  warnBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
});
