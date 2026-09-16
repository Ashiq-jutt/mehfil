import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, DialogCard, Icon } from '../../../components';
import { useSetBirthday } from '../../../hooks/useProfile';
import { colors, moderateScale, radius, spacing } from '../../../theme';
import { MONTH_NAMES } from '../../../utils/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialDay?: number | null;
  initialMonth?: number | null;
};

/** "When's your birthday?" with Date / Month dropdowns that expand into grids. */
export function BirthdayDialog({ visible, onClose, initialDay, initialMonth }: Props) {
  const [day, setDay] = useState<number | null>(initialDay ?? null);
  const [month, setMonth] = useState<number | null>(initialMonth ?? null);
  const [open, setOpen] = useState<'day' | 'month' | null>(null);
  const mutation = useSetBirthday();

  useEffect(() => {
    if (visible) {
      setDay(initialDay ?? null);
      setMonth(initialMonth ?? null);
      setOpen(initialMonth ? 'day' : 'month');
    }
  }, [visible, initialDay, initialMonth]);

  const daysInMonth = useMemo(() => (month ? new Date(2000, month, 0).getDate() : 31), [month]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const dayValid = day !== null && day <= daysInMonth;
  const canConfirm = dayValid && month !== null;

  const confirm = () => {
    if (!canConfirm) {
      return;
    }
    mutation.mutate({ day: day!, month: month! }, { onSuccess: onClose });
  };

  return (
    <DialogCard
      visible={visible}
      title="When's your birthday?"
      subtitle="Let others know so they can celebrate with you"
      onClose={onClose}>
      <View style={styles.dropdowns}>
        <Dropdown label={dayValid ? String(day) : 'Date'} open={open === 'day'} onPress={() => setOpen(open === 'day' ? null : 'day')} />
        <Dropdown
          label={month ? MONTH_NAMES[month - 1] : 'Month'}
          open={open === 'month'}
          onPress={() => setOpen(open === 'month' ? null : 'month')}
        />
      </View>

      {open === 'month' ? (
        <View style={styles.grid}>
          {MONTH_NAMES.map((name, i) => (
            <Cell
              key={name}
              label={name}
              active={month === i + 1}
              wide
              onPress={() => {
                setMonth(i + 1);
                setOpen('day');
              }}
            />
          ))}
        </View>
      ) : null}

      {open === 'day' ? (
        <View style={styles.grid}>
          {days.map(d => (
            <Cell
              key={d}
              label={String(d)}
              active={day === d}
              onPress={() => {
                setDay(d);
                setOpen(null);
              }}
            />
          ))}
        </View>
      ) : null}

      <Button label="Confirm" disabled={!canConfirm} loading={mutation.isPending} onPress={confirm} style={styles.confirm} />
    </DialogCard>
  );
}

function Dropdown({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.dropdown, { opacity: pressed ? 0.8 : 1 }]}>
      <AppText variant="bodyStrong">{label}</AppText>
      <Icon name={open ? 'chevronDown' : 'chevronRight'} size={moderateScale(16)} color={colors.textSecondary} />
    </Pressable>
  );
}

function Cell({ label, active, wide = false, onPress }: { label: string; active: boolean; wide?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.cell, wide ? styles.cellWide : null, active ? styles.cellActive : null, { opacity: pressed ? 0.8 : 1 }]}>
      <AppText variant="label" color={active ? 'textOnGold' : 'textPrimary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropdowns: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: moderateScale(44),
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  cell: {
    width: '11.5%',
    aspectRatio: 1,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWide: {
    width: '32%',
    aspectRatio: undefined,
    paddingVertical: spacing.sm,
  },
  cellActive: {
    backgroundColor: colors.accent,
  },
  confirm: {
    alignSelf: 'center',
    minWidth: moderateScale(160),
  },
});
