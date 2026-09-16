import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppText, DialogCard, LoadingState, TextField } from '../../components';
import { useCountries } from '../../hooks/useCatalog';
import { colors, moderateScale, radius, spacing } from '../../theme';
import type { CountryDto } from '../../api/types';

export const GLOBAL_OPTION: CountryDto = { code: 'GLOBAL', name: 'Global', flagEmoji: '🌐', isFeatured: true };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: CountryDto) => void;
  selectedCode?: string | null;
  /** Adds the "Global" row used by the Clubs filter. */
  includeGlobal?: boolean;
};

/** "Select Country" dialog with search, shared by the profile and the clubs filter. */
export function CountryPickerDialog({ visible, onClose, onSelect, selectedCode, includeGlobal = false }: Props) {
  const { data, isLoading } = useCountries();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const base = includeGlobal ? [GLOBAL_OPTION, ...(data ?? [])] : data ?? [];
    const q = query.trim().toLowerCase();
    return q ? base.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q) : base;
  }, [data, includeGlobal, query]);

  return (
    <DialogCard visible={visible} title="Select Country" onClose={onClose}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.search}
      />
      <View style={styles.listWrap}>
        {isLoading ? (
          <LoadingState />
        ) : (
          <FlatList
            data={items}
            keyExtractor={c => c.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <CountryRow country={item} selected={item.code === selectedCode} onPress={() => onSelect(item)} />
            )}
            ItemSeparatorComponent={Separator}
          />
        )}
      </View>
    </DialogCard>
  );
}

const CountryRow = React.memo(function CountryRowItem({
  country,
  selected,
  onPress,
}: {
  country: CountryDto;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, selected ? styles.rowSelected : null, { opacity: pressed ? 0.8 : 1 }]}>
      <AppText variant="heading">{country.flagEmoji}</AppText>
      <AppText variant="bodyStrong" style={styles.name} numberOfLines={1}>
        {country.name}
      </AppText>
    </Pressable>
  );
});

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  search: {
    marginBottom: spacing.md,
  },
  listWrap: {
    height: moderateScale(360),
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowSelected: {
    backgroundColor: colors.tileRaised,
  },
  name: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
