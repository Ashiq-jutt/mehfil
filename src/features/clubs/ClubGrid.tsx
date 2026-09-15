import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '../../components';
import { flattenPages, useFollowClub } from '../../hooks/useClubs';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { ClubCard } from './ClubCard';
import type { ClubCardDto, PagedResult } from '../../api/types';

type Props = {
  query: UseInfiniteQueryResult<InfiniteData<PagedResult<ClubCardDto>>, Error>;
  header?: React.ReactElement;
  emptyTitle: string;
  emptyMessage?: string;
  emptyIcon?: 'globe' | 'fire' | 'heart';
};

/** Paged two-column club grid shared by Explore / Hot / My. */
export function ClubGrid({ query, header, emptyTitle, emptyMessage, emptyIcon = 'globe' }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const follow = useFollowClub();
  const clubs = flattenPages(query.data);

  const onPress = useCallback((club: ClubCardDto) => navigation.navigate('ClubInfo', { publicId: club.id }), [navigation]);
  const onToggleFollow = useCallback(
    (club: ClubCardDto) => follow.mutate({ publicId: club.id, follow: !club.isFollowing }),
    [follow],
  );

  const renderItem = useCallback(
    ({ item }: { item: ClubCardDto }) => (
      <View style={styles.cell}>
        <ClubCard club={item} onPress={onPress} onToggleFollow={onToggleFollow} />
      </View>
    ),
    [onPress, onToggleFollow],
  );

  const empty = query.isLoading ? (
    <LoadingState />
  ) : query.isError ? (
    <ErrorState title="Could not load clubs" message={query.error.message} actionLabel="Retry" onAction={() => query.refetch()} />
  ) : (
    <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} style={styles.empty} />
  );

  return (
    <FlatList
      data={clubs}
      keyExtractor={c => c.id}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.footer} /> : undefined}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => {
            query.refetch();
          }}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cell: {
    flex: 1,
  },
  empty: {
    minHeight: 240,
  },
  footer: {
    marginVertical: spacing.lg,
  },
});
