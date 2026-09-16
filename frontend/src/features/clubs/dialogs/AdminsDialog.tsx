import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, Button, DialogCard, EmptyState, Icon, LoadingState, TextField } from '../../../components';
import { useClubAdmins, useDemoteAdmin, usePromoteAdmin } from '../../../hooks/useClubMembers';
import { colors, moderateScale, radius, spacing } from '../../../theme';
import { resolveAssetUrl } from '../../../utils/assets';
import { UserSearchDialog } from '../../shared/UserSearchDialog';
import type { ClubMemberDto } from '../../../api/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  clubId: string;
  isOwner: boolean;
  onPressMember?: (member: ClubMemberDto) => void;
};

/** "ADMIN (n/7)" list with search; the owner can add and remove admins. */
export function AdminsDialog({ visible, onClose, clubId, isOwner, onPressMember }: Props) {
  const [search, setSearch] = useState('');
  const [picker, setPicker] = useState(false);
  const admins = useClubAdmins(clubId, search, visible);
  const promote = usePromoteAdmin(clubId);
  const demote = useDemoteAdmin(clubId);

  const list = admins.data?.admins ?? [];
  const adminCount = list.filter(a => a.role === 'Admin').length;
  const max = admins.data?.max ?? 7;
  const canAdd = isOwner && adminCount < max && !search;

  return (
    <DialogCard visible={visible} title={`ADMIN (${adminCount}/${max})`} onClose={onClose}>
      <TextField value={search} onChangeText={setSearch} placeholder="Search by Name or ID" autoCapitalize="none" containerStyle={styles.search} />

      <View style={styles.listWrap}>
        {admins.isLoading && !admins.data ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <EmptyState icon="user" title="No admins match" />
        ) : (
          <FlatList
            data={list}
            keyExtractor={a => a.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable accessibilityRole="button" onPress={() => onPressMember?.(item)} style={styles.row}>
                <AvatarRing uri={resolveAssetUrl(item.avatarUrl)} size={moderateScale(40)} ring="none" />
                <View style={styles.text}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {item.displayName}
                  </AppText>
                  <View style={[styles.roleTag, item.role === 'Owner' ? styles.roleOwner : styles.roleAdmin]}>
                    <AppText variant="tiny">{item.role === 'Owner' ? '👑 OWNER' : '★ ADMIN'}</AppText>
                  </View>
                </View>
                {isOwner && item.role === 'Admin' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.displayName} as admin`}
                    hitSlop={8}
                    disabled={demote.isPending}
                    onPress={() => demote.mutate(item.id)}
                    style={styles.remove}>
                    <Icon name="close" size={moderateScale(14)} color={colors.white} strokeWidth={3} />
                  </Pressable>
                ) : null}
              </Pressable>
            )}
            ItemSeparatorComponent={Separator}
          />
        )}
      </View>

      {isOwner ? (
        <Button
          label={adminCount >= max ? 'Admin limit reached' : 'Add admin'}
          icon="plus"
          disabled={!canAdd}
          loading={promote.isPending}
          onPress={() => setPicker(true)}
          style={styles.add}
        />
      ) : null}

      <UserSearchDialog
        visible={picker}
        title="Add admin"
        excludeIds={list.map(a => a.id)}
        onClose={() => setPicker(false)}
        onSelect={user => {
          setPicker(false);
          promote.mutate(user.id);
        }}
      />
    </DialogCard>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  search: {
    marginBottom: spacing.md,
  },
  listWrap: {
    height: moderateScale(300),
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  roleOwner: {
    backgroundColor: colors.primaryDeep,
  },
  roleAdmin: {
    backgroundColor: colors.tileRaised,
  },
  remove: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    marginTop: spacing.md,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
