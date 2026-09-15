import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, AvatarRing, Button, Chip, HeartsPill, LoadingState } from '../../../components';
import { useGiftCatalog, useSendGift } from '../../../hooks/useEconomy';
import { useAuthStore } from '../../../store/authStore';
import { colors, moderateScale, radius, spacing } from '../../../theme';
import { resolveAssetUrl } from '../../../utils/assets';
import { formatNumber } from '../../../utils/format';
import { giftEmoji } from '../../economy/giftIcons';
import type { GiftDto, SeatDto } from '../../../api/types';

const QUANTITIES = [1, 5, 10, 50];

type Props = {
  visible: boolean;
  clubId: string;
  seats: SeatDto[];
  onClose: () => void;
  onOpenShop: () => void;
};

/** Bottom sheet: pick a receiver (seated user or the club), a gift and a quantity, then send. */
export function GiftSheet({ visible, clubId, seats, onClose, onOpenShop }: Props) {
  const insets = useSafeAreaInsets();
  const myId = useAuthStore(s => s.user?.id);
  const balance = useAuthStore(s => s.user?.heartsBalance ?? 0);
  const catalog = useGiftCatalog(visible);
  const send = useSendGift(clubId);
  const [gift, setGift] = useState<GiftDto | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [receiver, setReceiver] = useState<string | null>(null);

  const seated = useMemo(() => seats.filter(s => s.user && s.user.id !== myId).map(s => s.user!), [seats, myId]);

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setReceiver(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!gift && catalog.data?.length) {
      setGift(catalog.data[0]);
    }
  }, [catalog.data, gift]);

  const total = (gift?.heartsPrice ?? 0) * quantity;
  const enough = total <= balance;

  const submit = () => {
    if (!gift) {
      return;
    }
    send.mutate({ giftCode: gift.code, quantity, receiverId: receiver }, { onSuccess: onClose });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.header}>
            <AppText variant="heading" color="textGold" shadow>
              Send a gift
            </AppText>
            <Pressable accessibilityRole="button" onPress={onOpenShop}>
              <HeartsPill value={balance} onPressAdd={onOpenShop} />
            </Pressable>
          </View>

          <AppText variant="tiny" color="textMuted" style={styles.label}>
            TO
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.receivers}>
            <Pressable accessibilityRole="button" onPress={() => setReceiver(null)} style={[styles.receiver, receiver === null ? styles.receiverActive : null]}>
              <View style={styles.clubBubble}>
                <AppText variant="heading">🏠</AppText>
              </View>
              <AppText variant="tiny" numberOfLines={1}>
                Club
              </AppText>
            </Pressable>
            {seated.map(u => (
              <Pressable key={u.id} accessibilityRole="button" onPress={() => setReceiver(u.id)} style={[styles.receiver, receiver === u.id ? styles.receiverActive : null]}>
                <AvatarRing uri={resolveAssetUrl(u.avatarUrl)} size={moderateScale(44)} ring="none" />
                <AppText variant="tiny" numberOfLines={1}>
                  {u.displayName}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          {catalog.isLoading ? <LoadingState /> : null}
          <View style={styles.grid}>
            {(catalog.data ?? []).map(g => {
              const active = gift?.code === g.code;
              return (
                <Pressable key={g.code} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setGift(g)} style={[styles.gift, active ? styles.giftActive : null]}>
                  <AppText variant="display">{giftEmoji(g.code)}</AppText>
                  <AppText variant="tiny" numberOfLines={1}>
                    {g.name}
                  </AppText>
                  <AppText variant="tiny" color="textGold">
                    ♥ {formatNumber(g.heartsPrice)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.quantities}>
              {QUANTITIES.map(q => (
                <Chip key={q} label={`×${q}`} active={quantity === q} onPress={() => setQuantity(q)} />
              ))}
            </View>
            <Button
              label={enough ? `Send · ♥ ${formatNumber(total)}` : 'Top up hearts'}
              variant={enough ? 'primary' : 'secondary'}
              disabled={!gift}
              loading={send.isPending}
              onPress={enough ? submit : onOpenShop}
              style={styles.send}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.modalDeep,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderGold,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    marginTop: spacing.xs,
  },
  receivers: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  receiver: {
    alignItems: 'center',
    width: moderateScale(56),
    gap: 2,
    padding: 2,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  receiverActive: {
    borderColor: colors.accent,
  },
  clubBubble: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.tileRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gift: {
    width: '18%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  giftActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(246,172,25,0.15)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  quantities: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  send: {
    flex: 1,
  },
});
