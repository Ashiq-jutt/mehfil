import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, moderateScale, spacing } from '../../theme';
import { AppText } from './AppText';
import { CloseButton } from './Buttons';
import { Panel } from './Panel';

type Props = PropsWithChildren<{
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  /** Tap outside to dismiss. */
  dismissOnBackdrop?: boolean;
}>;

/** Centered gold-bordered magenta dialog with the red close bubble on the corner. */
export function DialogCard({ visible, title, subtitle, onClose, dismissOnBackdrop = true, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissOnBackdrop ? onClose : undefined} />
        <View style={styles.cardWrap}>
          <Panel variant="modal" style={styles.card}>
            {title ? (
              <AppText variant="title" align="center" shadow style={styles.title}>
                {title}
              </AppText>
            ) : null}
            {subtitle ? (
              <AppText variant="body" color="textSecondary" align="center" style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
            {children}
          </Panel>
          <CloseButton onPress={onClose} style={styles.close} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  cardWrap: {
    width: '100%',
    maxWidth: moderateScale(360),
  },
  card: {
    paddingTop: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  close: {
    position: 'absolute',
    top: -moderateScale(12),
    right: -moderateScale(10),
  },
});
