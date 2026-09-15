import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../components';
import { spacing } from '../../theme';

/** Featured chips as seeded on the backend; the countries endpoint replaces this list in phase 4. */
const FEATURED = [
  { code: 'GLOBAL', name: 'Global', flag: '🌐' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'GB', name: 'UK', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
];

type Props = { onMore?: () => void };

export function CountryChips({ onMore }: Props) {
  const [active, setActive] = useState('GLOBAL');

  return (
    <View style={styles.wrap}>
      {FEATURED.map(c => (
        <Chip key={c.code} label={c.name} emoji={c.flag} active={active === c.code} onPress={() => setActive(c.code)} />
      ))}
      <Chip label="More ≫" onPress={onMore} />
    </View>
  );
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
