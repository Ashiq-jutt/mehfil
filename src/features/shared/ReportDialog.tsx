import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Chip, DialogCard, LoadingState, TextField } from '../../components';
import { useReportReasons } from '../../hooks/useCatalog';
import { useCreateReport } from '../../hooks/useReports';
import { spacing } from '../../theme';
import type { ReportTargetType } from '../../api/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
};

/** Report a user / club / message: pick a reason, optionally add details. */
export function ReportDialog({ visible, onClose, targetType, targetId, targetLabel }: Props) {
  const reasons = useReportReasons(visible);
  const create = useCreateReport();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (visible) {
      setReason(null);
      setDetails('');
    }
  }, [visible]);

  const submit = () => {
    if (!reason) {
      return;
    }
    create.mutate({ targetType, targetId, reason, details: details.trim() || null }, { onSettled: onClose });
  };

  return (
    <DialogCard visible={visible} title="Report" subtitle={targetLabel} onClose={onClose}>
      {reasons.isLoading ? <LoadingState /> : null}
      <View style={styles.chips}>
        {(reasons.data ?? []).map(r => (
          <Chip key={r.code} label={r.label} active={reason === r.code} onPress={() => setReason(r.code)} />
        ))}
      </View>
      <TextField
        label="Details (optional)"
        value={details}
        onChangeText={setDetails}
        maxLength={1000}
        multiline
        placeholder="What happened?"
        containerStyle={styles.field}
        style={styles.details}
      />
      <AppText variant="tiny" color="textMuted" style={styles.note}>
        Reports are confidential. Abuse of reporting may lead to restrictions.
      </AppText>
      <Button label="Submit report" variant="danger" disabled={!reason} loading={create.isPending} onPress={submit} />
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.sm,
  },
  details: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  note: {
    marginBottom: spacing.md,
  },
});
