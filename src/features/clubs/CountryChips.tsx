import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../components';
import { useCountries } from '../../hooks/useCatalog';
import { GLOBAL_COUNTRY, useClubsFilterStore } from '../../store/clubsFilterStore';
import { spacing } from '../../theme';
import { CountryPickerDialog } from '../shared/CountryPickerDialog';

/** Global + featured countries as chips; "More ≫" opens the full picker. Selection is shared across tabs. */
export function CountryChips() {
  const { data } = useCountries();
  const country = useClubsFilterStore(s => s.country);
  const setCountry = useClubsFilterStore(s => s.setCountry);
  const [pickerVisible, setPickerVisible] = useState(false);

  const chips = useMemo(() => {
    const featured = (data ?? []).filter(c => c.isFeatured);
    const list = [GLOBAL_COUNTRY, ...featured];
    if (!list.some(c => c.code === country.code)) {
      list.splice(1, 0, country); // keep a non-featured selection visible
    }
    return list;
  }, [data, country]);

  return (
    <View style={styles.wrap}>
      {chips.map(c => (
        <Chip
          key={c.code}
          label={shortName(c.name)}
          emoji={c.flagEmoji}
          active={country.code === c.code}
          onPress={() => setCountry(c)}
        />
      ))}
      <Chip label="More ≫" onPress={() => setPickerVisible(true)} />

      <CountryPickerDialog
        visible={pickerVisible}
        includeGlobal
        selectedCode={country.code}
        onClose={() => setPickerVisible(false)}
        onSelect={c => {
          setCountry(c);
          setPickerVisible(false);
        }}
      />
    </View>
  );
}

const SHORT: Record<string, string> = {
  'United Kingdom': 'UK',
  'United States': 'USA',
  'United Arab Emirates': 'UAE',
  'Saudi Arabia': 'Saudi Ara..',
};

function shortName(name: string) {
  return SHORT[name] ?? (name.length > 11 ? `${name.slice(0, 9)}..` : name);
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
