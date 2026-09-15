import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, Button, DialogCard, LoadingState } from '../../components';
import { useBlocks, useUnblockUser } from '../../hooks/useBlocks';
import { colors, moderateScale, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';

type Props = { visible: boolean; onClose: () => void };

/** People you blocked, with one-tap unblock. */
export function BlockedUsersDialog({ visible, onClose }: Props) {
  const blocks = useBlocks();
  const unblock = useUnblockUser();
  return (
    <DialogCard visible={visible} title="Blocked users" onClose={onClose}>
      <View style={styles.list}>
        {blocks.isLoading ? <LoadingState /> : null}
        {blocks.data && blocks.data.length === 0 ? (
          <AppText variant="body" color="textMuted" align="center">
            You haven't blocked anyone.
          </AppText>
        ) : null}
        <FlatList
          data={blocks.data ?? []}
          keyExtractor={b => b.id}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <AvatarRing uri={resolveAssetUrl(item.avatarUrl)} size={moderateScale(36)} ring="none" />
              <View style={styles.text}>
                <AppText variant="label" numberOfLines={1}>
                  {item.displayName}
                </AppText>
                <AppText variant="tiny" color="textMuted">
                  ID: {item.id}
                </AppText>
              </View>
              <Button label="Unblock" variant="secondary" loading={unblock.isPending && unblock.variables === item.id} onPress={() => unblock.mutate(item.id)} style={styles.button} />
            </View>
          )}
        />
      </View>
    </DialogCard>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    maxHeight: moderateScale(380),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    flex: 1,
  },
  button: {
    height: moderateScale(34),
    minWidth: moderateScale(90),
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
