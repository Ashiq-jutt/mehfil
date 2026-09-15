import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, DialogCard, TextField } from '../../../components';
import { spacing } from '../../../theme';
import type { SeatDto } from '../../../api/types';

// ---- EXIT? ---------------------------------------------------------------

export function ExitDialog({ visible, onCancel, onExit }: { visible: boolean; onCancel: () => void; onExit: () => void }) {
  return (
    <DialogCard visible={visible} title="EXIT?" onClose={onCancel} dismissOnBackdrop={false}>
      <View style={styles.exitBox}>
        <AppText variant="bodyStrong" align="center">
          Are you sure you want to exit the club?
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button label="EXIT" variant="danger" onPress={onExit} style={styles.action} />
        <Button label="Cancel" onPress={onCancel} style={styles.action} />
      </View>
    </DialogCard>
  );
}

// ---- Announcement -------------------------------------------------------

export function AnnouncementDialog({
  visible,
  initial,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: string;
  saving: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (visible) {
      setText(initial);
    }
  }, [visible, initial]);

  return (
    <DialogCard visible={visible} title="Announcement" subtitle="Shown to everyone who enters the room" onClose={onClose}>
      <TextField value={text} onChangeText={setText} maxLength={500} multiline placeholder="Welcome everyone!" containerStyle={styles.field} style={styles.multiline} />
      <AppText variant="tiny" color="textMuted" align="right" style={styles.counter}>
        {text.length}/500
      </AppText>
      <Button label="Save" loading={saving} onPress={() => onSave(text.trim())} />
    </DialogCard>
  );
}

// ---- Seat menu ------------------------------------------------------------

export type SeatAction = 'sit' | 'leaveSeat' | 'lock' | 'unlock' | 'mute' | 'unmute' | 'removeFromSeat' | 'kick' | 'ban' | 'viewCard';

type SeatMenuProps = {
  seat: SeatDto | null;
  isMe: boolean;
  canModerate: boolean;
  isOwnerOccupant: boolean;
  onClose: () => void;
  onAction: (action: SeatAction) => void;
};

/** Context menu for a seat: sit/leave for members, moderation for owner and admins. */
export function SeatMenuDialog({ seat, isMe, canModerate, isOwnerOccupant, onClose, onAction }: SeatMenuProps) {
  if (!seat) {
    return null;
  }
  const occupied = !!seat.user;
  const title = occupied ? seat.user!.displayName : `Seat ${seat.index}`;
  const subtitle = occupied ? `Level ${seat.user!.level} · ${seat.user!.role}` : seat.isLocked ? 'Locked' : 'Empty seat';

  const actions: { label: string; action: SeatAction; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }[] = [];
  if (occupied) {
    actions.push({ label: 'View player card', action: 'viewCard', variant: 'secondary' });
    if (isMe) {
      actions.push({ label: 'Leave seat', action: 'leaveSeat', variant: 'ghost' });
    } else if (canModerate && !isOwnerOccupant) {
      actions.push({ label: seat.isMuted ? 'Unmute seat' : 'Mute seat', action: seat.isMuted ? 'unmute' : 'mute', variant: 'ghost' });
      actions.push({ label: 'Remove from seat', action: 'removeFromSeat', variant: 'ghost' });
      actions.push({ label: 'Kick from room', action: 'kick', variant: 'danger' });
      actions.push({ label: 'Ban from club', action: 'ban', variant: 'danger' });
    }
  } else {
    if (!seat.isLocked) {
      actions.push({ label: 'Sit here', action: 'sit' });
    }
    if (canModerate && !seat.isOwnerSeat) {
      actions.push({ label: seat.isLocked ? 'Unlock seat' : 'Lock seat', action: seat.isLocked ? 'unlock' : 'lock', variant: 'ghost' });
    }
  }

  return (
    <DialogCard visible title={title} subtitle={subtitle} onClose={onClose}>
      <View style={styles.menu}>
        {actions.map(a => (
          <Button key={a.action} label={a.label} variant={a.variant ?? 'primary'} onPress={() => onAction(a.action)} />
        ))}
        {actions.length === 0 ? (
          <AppText variant="body" color="textMuted" align="center">
            Nothing to do here.
          </AppText>
        ) : null}
      </View>
    </DialogCard>
  );
}

const styles = StyleSheet.create({
  exitBox: {
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
  field: {
    marginBottom: spacing.xs,
  },
  multiline: {
    height: 110,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  counter: {
    marginBottom: spacing.md,
  },
  menu: {
    gap: spacing.sm,
  },
});
