import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { colors } from '../theme';
import { LoginScreen } from '../features/auth/LoginScreen';
import { SplashScreen } from '../features/auth/SplashScreen';
import { ClubsHomeScreen } from '../features/clubs/ClubsHomeScreen';
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
