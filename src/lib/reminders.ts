import type { Deadline, Hearing } from '@/api/types';

/**
 * تخطيط التذكيرات المحلية (دالة نقية قابلة للاختبار).
 * قاعدة الرائد: نص الإشعار عام بلا اسم ولا رقم قضية، والتفاصيل داخل التطبيق.
 * وقاعدة المهل: لا تذكير على مهلة غير مؤكدة.
 */
export type PlannedReminder = {
  id: string;
  at: Date;
  title: string;
  body: string;
  url: string;
};

type Options = { hearings: boolean; deadlines: boolean; now?: Date };

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function atNine(d: Date): Date {
  const x = new Date(d);
  x.setHours(9, 0, 0, 0);
  return x;
}

export function planReminders(
  hearings: Pick<Hearing, 'id' | 'caseId' | 'scheduledAt' | 'status'>[],
  deadlines: Pick<Deadline, 'id' | 'caseId' | 'dueAt' | 'confirmed'>[],
  { hearings: withHearings, deadlines: withDeadlines, now = new Date() }: Options,
): PlannedReminder[] {
  const out: PlannedReminder[] = [];

  if (withHearings) {
    for (const h of hearings) {
      if (h.status !== 'scheduled') continue;
      const start = new Date(h.scheduledAt);
      const url = `/case/${h.caseId}/hearing/${h.id}`;
      out.push(
        { id: `h-${h.id}-1d`, at: new Date(start.getTime() - DAY), title: 'لديك جلسة غداً', body: 'افتح محاميك وراجع قائمة التجهيز.', url },
        { id: `h-${h.id}-1h`, at: new Date(start.getTime() - HOUR), title: 'جلستك بعد ساعة', body: 'تأكد من الاتصال والمستندات قبل الموعد.', url },
      );
    }
  }

  if (withDeadlines) {
    for (const d of deadlines) {
      if (!d.confirmed) continue;
      const due = new Date(d.dueAt);
      const url = `/case/${d.caseId}`;
      out.push(
        { id: `d-${d.id}-3d`, at: atNine(new Date(due.getTime() - 3 * DAY)), title: 'مهلة تنتهي بعد 3 أيام', body: 'افتح محاميك لترى المطلوب منك.', url },
        { id: `d-${d.id}-1d`, at: atNine(new Date(due.getTime() - DAY)), title: 'مهلة تنتهي غداً', body: 'لا تؤجلها، افتح محاميك الآن.', url },
      );
    }
  }

  return out.filter((r) => r.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime());
}
