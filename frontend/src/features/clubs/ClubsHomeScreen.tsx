import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { IconButton, LanternsHeader, PillTabs, Screen } from '../../components';
import type { ClubsTabParamList } from '../../navigation/types';
import { ClubsTopBar } from './ClubsTopBar';
import { EnterClubDialog } from './EnterClubDialog';
import { styles } from './ClubsHomeScreen.styles';
import { ExploreTab, HotTab, MyTab } from './tabs';

const Tabs = createMaterialTopTabNavigator<ClubsTabParamList>();

const TAB_ITEMS = [
  { key: 'Explore', label: 'Explore', icon: 'globe' as const },
  { key: 'Hot', label: 'Hot', icon: 'fire' as const },
  { key: 'My', label: 'My', icon: 'heart' as const },
];

/** Clubs Home: top bar, Explore / Hot / My pill tabs and the club grid (phase 4). */
export function ClubsHomeScreen() {
  const [searchVisible, setSearchVisible] = useState(false);

  const renderTabBar = useCallback(
    ({ state, navigation }: MaterialTopTabBarProps) => (
      <View style={styles.tabBarWrap}>
        <PillTabs
          items={TAB_ITEMS}
          activeKey={state.routeNames[state.index]}
          onChange={key => navigation.navigate(key)}
          trailing={
            <IconButton
              icon="search"
              accessibilityLabel="Enter a club by ID"
              background="rgba(255,255,255,0.18)"
              onPress={() => setSearchVisible(true)}
            />
          }
        />
      </View>
    ),
    [],
  );

  return (
    <Screen>
      <LanternsHeader />
      <ClubsTopBar />

      <Tabs.Navigator
        tabBar={renderTabBar}
        screenOptions={{ lazy: true, swipeEnabled: true, sceneStyle: styles.scene }}>
        <Tabs.Screen name="Explore" component={ExploreTab} />
        <Tabs.Screen name="Hot" component={HotTab} />
        <Tabs.Screen name="My" component={MyTab} />
      </Tabs.Navigator>

      <EnterClubDialog visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </Screen>
  );
}
