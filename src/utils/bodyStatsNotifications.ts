import * as Notifications from 'expo-notifications';

/**
 * Schedule a daily repeating notification at the given time.
 * Returns the notification ID(s) that were scheduled, or [] if permission was denied.
 */
export async function scheduleBodyStatsReminder(time: string): Promise<string[]> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return [];

    const [hStr, mStr] = time.split(':');
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return [];
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to log your body stats 💪',
        body: 'Take a moment to check in — weight, BP, and more',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return [id];
  } catch {
    return [];
  }
}

/**
 * Cancel previously scheduled body stats reminders by ID list.
 */
export async function cancelBodyStatsReminder(notifIds?: string[]): Promise<void> {
  if (!notifIds || notifIds.length === 0) return;
  for (const id of notifIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // silently ignore — may already be gone
    }
  }
}
