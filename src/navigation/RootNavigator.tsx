import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { colors } from '../theme';
import { LoginScreen } from '../features/auth/LoginScreen';
import { SplashScreen } from '../features/auth/SplashScreen';
import { ClubInfoScreen } from '../features/clubs/ClubInfoScreen';
import { ClubsHomeScreen } from '../features/clubs/ClubsHomeScreen';
import { CreateClubScreen } from '../features/clubs/CreateClubScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ShopScreen } from '../features/economy/ShopScreen';
import { LeaderboardScreen } from '../features/leaderboard/LeaderboardScreen';
import { ClubStoreScreen } from '../features/store/ClubStoreScreen';
import { ClubRoomScreen } from '../features/room/ClubRoomScreen';
import { useAuthStore } from '../store/authStore';
import type { AuthStackParamList, MainStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.screen,
    card: colors.panel,
    text: colors.textPrimary,
    primary: colors.accent,
    border: colors.border,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.screen },
      }}>
      <MainStack.Screen name="ClubsHome" component={ClubsHomeScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_bottom' }} />
      <MainStack.Screen name="ClubInfo" component={ClubInfoScreen} />
      <MainStack.Screen name="ClubRoom" component={ClubRoomScreen} options={{ gestureEnabled: false }} />
      <MainStack.Screen name="Shop" component={ShopScreen} options={{ animation: 'slide_from_bottom' }} />
      <MainStack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ animation: 'slide_from_bottom' }} />
      <MainStack.Screen name="ClubStore" component={ClubStoreScreen} options={{ animation: 'slide_from_bottom' }} />
      <MainStack.Screen name="CreateClub" component={CreateClubScreen} options={{ animation: 'slide_from_bottom' }} />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const status = useAuthStore(s => s.status);

  if (status === 'restoring') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'signedIn' ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
