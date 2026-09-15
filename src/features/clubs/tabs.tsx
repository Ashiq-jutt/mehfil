import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, PillTabs } from '../../components';
import { flattenPages, useClubsFeed, useMyClubs, useTopClubs } from '../../hooks/useClubs';
import type { MainStackParamList } from '../../navigation/types';
import { toast } from '../../store/toastStore';
import { spacing } from '../../theme';
import { ClubGrid } from './ClubGrid';
import { CountryChips } from './CountryChips';
import { TopClubsBanner } from './TopClubsBanner';
import { WelcomeOfferBanner } from './WelcomeOfferBanner';
import type { MyClubsFilter } from '../../api/types';

export function ExploreTab() {
  const feed = useClubsFeed('Explore');
  const top = useTopClubs();

  const header = (
    <View>
      {top.data && top.data.length > 0 ? <TopClubsBanner clubs={top.data} /> : null}
      <WelcomeOfferBanner onPress={() => toast.info('The Shop arrives in phase 8.')} />
      <CountryChips />
    </View>
  );

  return <ClubGrid query={feed} header={header} emptyTitle="No clubs here yet" emptyMessage="Try another country or create your own club from the My tab." />;
}

export function HotTab() {
  const feed = useClubsFeed('Hot');
  return (
    <ClubGrid
      query={feed}
      header={<CountryChips />}
      emptyIcon="fire"
      emptyTitle="Nothing hot right now"
      emptyMessage="Clubs with people inside show up here first."
    />
  );
}

const MY_TABS = [
  { key: 'Followed', label: 'Followed' },
  { key: 'Recents', label: 'Recents' },
];

export function MyTab() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [filter, setFilter] = useState<MyClubsFilter>('Followed');
  const query = useMyClubs(filter);
  const followed = useMyClubs('Followed');
  const ownsClub = flattenPages(followed.data).some(c => c.isMine);

  const header = (
    <View>
      <PillTabs items={MY_TABS} activeKey={filter} onChange={key => setFilter(key as MyClubsFilter)} style={styles.subTabs} />
      {!ownsClub && followed.isSuccess ? (
        <Button label="Create your club" icon="plus" onPress={() => navigation.navigate('CreateClub', {})} style={styles.create} />
      ) : null}
    </View>
  );

  return (
    <ClubGrid
      query={query}
      header={header}
      emptyIcon="heart"
      emptyTitle={filter === 'Followed' ? 'No followed clubs' : 'No recent clubs'}
      emptyMessage={filter === 'Followed' ? 'Tap the heart on any club to keep it here.' : 'Clubs you open show up here.'}
    />
  );
}

const styles = StyleSheet.create({
  subTabs: {
    marginHorizontal: spacing.xxxl,
    marginBottom: spacing.md,
  },
  create: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
});
