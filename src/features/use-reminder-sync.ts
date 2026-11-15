import { useEffect } from 'react';

import { syncReminders } from '@/lib/notifications';
import { planReminders } from '@/lib/reminders';
import { useSettings } from '@/providers/settings-provider';
import { useDeadlines, useUpcomingHearings } from './queries';

/** يبقي التذكيرات المحلية متزامنة مع الجلسات والمهل وإعدادات المستخدم. */
export function useReminderSync() {
  const hearings = useUpcomingHearings();
  const deadlines = useDeadlines();
  const { hearingReminders, deadlineReminders } = useSettings();

  useEffect(() => {
    if (!hearings.data || !deadlines.data) return;
    const plan = planReminders(hearings.data, deadlines.data, { hearings: hearingReminders, deadlines: deadlineReminders });
    void syncReminders(plan);
  }, [hearings.data, deadlines.data, hearingReminders, deadlineReminders]);
}
