import messaging from '@react-native-firebase/messaging';
import type { QueryClient } from '@tanstack/react-query';
import { PermissionsAndroid, Platform } from 'react-native';

import { notificationsApi } from '../api';
import { env } from '../config/env';
import { notificationsRootKey } from '../hooks/useNotifications';
import { navigateFromNotification } from '../navigation/navigationRef';
import { toast } from '../store/toastStore';

type Unsubscribe = () => void;

let subscriptions: Unsubscribe[] = [];
let currentToken: string | null = null;

const platform = Platform.OS === 'ios' ? 'Ios' : 'Android';

function stop() {
  subscriptions.forEach(unsubscribe => unsubscribe());
  subscriptions = [];
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }
  const status = await messaging().requestPermission();
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

/**
 * Registers this device for push after sign-in: asks permission, sends the FCM token to the API,
 * shows foreground messages as toasts and routes taps on notifications. No-op unless PUSH_ENABLED.
 */
export async function initPush(queryClient: QueryClient): Promise<void> {
  if (!env.pushEnabled) {
    return;
  }
  stop();
  try {
    if (!(await ensurePermission())) {
      return;
    }

    currentToken = await messaging().getToken();
    if (currentToken) {
      await notificationsApi.registerDevice(platform, currentToken);
    }

    subscriptions.push(
      messaging().onTokenRefresh(async token => {
        currentToken = token;
        await notificationsApi.registerDevice(platform, token).catch(() => undefined);
      }),
      messaging().onMessage(async message => {
        const title = message.notification?.title ?? 'Mehfil';
        const body = message.notification?.body;
        toast.info(body ? `${title}: ${body}` : title);
        queryClient.invalidateQueries({ queryKey: notificationsRootKey });
      }),
      messaging().onNotificationOpenedApp(message => navigateFromNotification(message.data)),
    );

    const initial = await messaging().getInitialNotification();
    if (initial) {
      navigateFromNotification(initial.data);
    }
  } catch (error) {
    // Missing google-services.json / GoogleService-Info.plist or a denied permission: keep the app usable.
    console.warn('[push] not available', error);
  }
}

/** Forgets this device on the API and locally. Safe to call when push was never initialised. */
export async function unregisterPush(): Promise<void> {
  stop();
  if (!env.pushEnabled) {
    return;
  }
  try {
    const token = currentToken ?? (await messaging().getToken());
    if (token) {
      await notificationsApi.unregisterDevice(token).catch(() => undefined);
    }
    await messaging().deleteToken();
  } catch (error) {
    console.warn('[push] unregister failed', error);
  } finally {
    currentToken = null;
  }
}
