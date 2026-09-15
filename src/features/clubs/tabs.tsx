import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, PillTabs } from '../../components';
import { spacing } from '../../theme';
import { CountryChips } from './CountryChips';
import { WelcomeOfferBanner } from './WelcomeOfferBanner';

const CLUBS_NOTE = 'Club listing connects to the API in phase 4.';

export function ExploreTab() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WelcomeOfferBanner onPress={() => Alert.alert('Shop', 'The Shop arrives in phase 8.')} />
      <CountryChips onMore={() => Alert.alert('Select Country', 'Country picker arrives in phase 4.')} />
      <EmptyState icon="globe" title="No clubs yet" message={CLUBS_NOTE} style={styles.empty} />
    </ScrollView>
  );
}

export function HotTab() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <CountryChips />
      <EmptyState icon="fire" title="Nothing hot right now" message={CLUBS_NOTE} style={styles.empty} />
    </ScrollView>
  );
}

const MY_TABS = [
  { key: 'followed', label: 'Followed' },
  { key: 'recents', label: 'Recents' },
];

export function MyTab() {
  const [sub, setSub] = useState('followed');
  return (
    <View style={styles.content}>
      <PillTabs items={MY_TABS} activeKey={sub} onChange={setSub} style={styles.subTabs} />
      <EmptyState
        icon="heart"
        title={sub === 'followed' ? 'No followed clubs' : 'No recent clubs'}
        message={CLUBS_NOTE}
        style={styles.empty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  subTabs: {
    marginHorizontal: spacing.xxxl,
    marginBottom: spacing.md,
  },
  empty: {
    minHeight: 260,
  },
});
