import { createNavigationContainerRef } from '@react-navigation/native';

import { notificationTarget, NotificationTarget } from './notificationTarget';
import type { MainStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

let pending: NotificationTarget | null = null;

function go(target: NotificationTarget) {
  if (target.screen === 'ClubRoom') {
    navigationRef.navigate('ClubRoom', target.params);
  } else {
    navigationRef.navigate(target.screen);
  }
}

/** Opens the screen a push notification points at; waits for the navigator when the app is still starting. */
export function navigateFromNotification(data: Record<string, unknown> | null | undefined) {
  const target = notificationTarget(data);
  if (navigationRef.isReady()) {
    go(target);
  } else {
    pending = target;
  }
}

/** Called from the container's onReady to deliver a target that arrived before the navigator existed. */
export function flushPendingNavigation() {
  if (pending && navigationRef.isReady()) {
    const target = pending;
    pending = null;
    go(target);
  }
}
