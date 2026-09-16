/** Where a notification's data payload should take the user. Pure so it can be unit-tested. */
export type NotificationTarget =
  | { screen: 'ClubRoom'; params: { publicId: string } }
  | { screen: 'Leaderboard'; params?: undefined }
  | { screen: 'Notifications'; params?: undefined };

type Data = Record<string, unknown> | null | undefined;

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function notificationTarget(data: Data): NotificationTarget {
  const clubId = text(data?.clubId);
  if (clubId) {
    return { screen: 'ClubRoom', params: { publicId: clubId } };
  }
  if (text(data?.board)) {
    return { screen: 'Leaderboard' };
  }
  return { screen: 'Notifications' };
}

/** Parses the stored JSON payload; anything malformed becomes null. */
export function parseNotificationData(json: string | null | undefined): Record<string, unknown> | null {
  if (!json) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
