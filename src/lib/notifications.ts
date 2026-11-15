import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { PlannedReminder } from './reminders';

const CHANNEL = 'reminders';
const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'تذكير الجلسات والمهل',
      // eslint-disable-next-line import/namespace -- يُصدَّر عبر export * ولا تراه قاعدة ESLint
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** يعيد جدولة كل التذكيرات المحلية حسب الخطة الحالية. */
export async function syncReminders(plan: PlannedReminder[]): Promise<void> {
  if (!supported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!plan.length || !(await ensurePermission())) return;
    for (const r of plan.slice(0, 50)) {
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, data: { url: r.url } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL },
      });
    }
  } catch {
    // التذكير ميزة مساعدة: لا نوقف التطبيق إن تعذرت الجدولة
  }
}

/** عند لمس إشعار: افتح الشاشة المرتبطة به. */
export function useNotificationRouting() {
  useEffect(() => {
    if (!supported) return;
    const open = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as never);
        Notifications.clearLastNotificationResponse();
      }
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) open(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
    return () => sub.remove();
  }, []);
}
