import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText, AvatarRing, DialogCard, EmptyState, LoadingState, TextField } from '../../components';
import { useUserSearch } from '../../hooks/useClubMembers';
import { colors, moderateScale, radius, spacing } from '../../theme';
import { resolveAssetUrl } from '../../utils/assets';
import type { UserSearchResultDto } from '../../api/types';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (user: UserSearchResultDto) => void;
  /** Ids to hide (e.g. users who are already admins). */
  excludeIds?: string[];
};

/** Search users by name or ID and pick one (add admin, invite …). */
export function UserSearchDialog({ visible, title, onClose, onSelect, excludeIds = [] }: Props) {
  const [query, setQuery] = useState('');
  const search = useUserSearch(query);

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const results = (search.data ?? []).filter(u => !excludeIds.includes(u.id));
  const active = query.trim().length >= 2;

  return (
    <DialogCard visible={visible} title={title} onClose={onClose}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or ID"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        containerStyle={styles.search}
      />
      <View style={styles.listWrap}>
        {!active ? (
          <EmptyState icon="search" title="Type at least 2 characters" />
        ) : search.isLoading ? (
          <LoadingState />
        ) : results.length === 0 ? (
          <EmptyState icon="user" title="No users found" />
        ) : (
          <FlatList
            data={results}
            keyExtractor={u => u.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable accessibilityRole="button" onPress={() => onSelect(item)} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
                <AvatarRing uri={resolveAssetUrl(item.avatarUrl)} size={moderateScale(40)} ring="none" />
                <View style={styles.text}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {item.displayName}
                  </AppText>
                  <AppText variant="tiny" color="textMuted">
                    ID: {item.id} · Lv {item.level}
                  </AppText>
                </View>
                {item.isOnline ? <View style={styles.online} /> : null}
              </Pressable>
            )}
            ItemSeparatorComponent={Separator}
          />
        )}
      </View>
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
  },
  online: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.online,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
