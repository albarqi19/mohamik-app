import { ApiError } from '../client';
import type { Case, Hearing, HearingOutcomeInput, NextStep } from '../types';

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export const DEFAULT_PREP = [
  'راجع المحضر السابق وما طلبته المحكمة',
  'جهّز ردك على ما قدمه الطرف الآخر',
  'اجمع المستندات المطلوبة في ملف واحد',
  'تأكد من رابط الجلسة أو موقعها قبل ساعة',
];

const RESULT_TEXT: Record<HearingOutcomeInput['result'], string> = {
  postponed: 'أُجّلت الجلسة',
  reserved: 'حُجزت القضية للحكم',
  judgment: 'صدر الحكم في الجلسة',
  not_held: 'لم تنعقد الجلسة',
};

/** يطبق ما جرى في الجلسة على القضية: حالة الجلسة، الجلسة التالية، المرحلة، والخطوة التالية. يعدل القضية مباشرة. */
export function applyHearingOutcome(c: Case, hearingId: string, input: HearingOutcomeInput, now = new Date()): Case {
  const h = c.hearings.find((x) => x.id === hearingId);
  if (!h) throw new ApiError('الجلسة غير موجودة', 404);
  if (h.status !== 'scheduled') throw new ApiError('سُجّل ما جرى في هذه الجلسة من قبل', 409);
  const needsDate = input.result === 'postponed' || input.result === 'not_held';
  if (needsDate && !input.nextAt) throw new ApiError('حدد موعد الجلسة القادمة', 422);

  const iso = now.toISOString();
  const note = input.note?.trim();
  h.status = input.result === 'not_held' ? 'postponed' : 'held';
  h.outcome = note ? `${RESULT_TEXT[input.result]}. ${note}` : RESULT_TEXT[input.result];

  let next: Hearing | undefined;
  if (input.nextAt) {
    next = {
      id: uid('h'),
      caseId: c.id,
      number: Math.max(...c.hearings.map((x) => x.number)) + 1,
      scheduledAt: input.nextAt,
      mode: h.mode,
      location: h.location,
      meetingUrl: h.meetingUrl,
      status: 'scheduled',
      agenda: input.result === 'reserved' ? 'جلسة النطق بالحكم' : undefined,
      preparation: input.result === 'reserved' ? [] : DEFAULT_PREP.map((label) => ({ id: uid('p'), label, done: false })),
    };
    c.hearings.push(next);
  }
  c.nextHearingAt = next?.scheduledAt;

  // الخطوات المتعلقة بالجلسة الماضية انتهت
  c.nextSteps = c.nextSteps.map((s) => (s.action === 'record_outcome' || s.action === 'prepare_hearing' ? { ...s, done: true } : s));
  const step = (s: Omit<NextStep, 'id' | 'done'>) => c.nextSteps.unshift({ id: uid('s'), done: false, ...s });

  switch (input.result) {
    case 'postponed':
    case 'not_held':
      if (c.stage === 'filed' || c.stage === 'drafting') c.stage = 'hearings';
      step({ title: `جهّز للجلسة ${next!.number}`, detail: 'قائمة تجهيز جاهزة لك.', dueAt: next!.scheduledAt, action: 'prepare_hearing' });
      if (input.result === 'postponed') {
        step({ title: 'ارفع محضر الجلسة', detail: 'أستخرج منه طلبات المحكمة والمهل.', action: 'upload_document' });
      }
      c.progress = Math.max(c.progress, 0.45);
      break;
    case 'reserved':
      c.stage = 'reserved';
      step({ title: 'انتظر النطق بالحكم', detail: next ? 'سأذكرك قبل الموعد.' : 'أضف موعد النطق إذا عرفته.', dueAt: next?.scheduledAt });
      c.progress = Math.max(c.progress, 0.65);
      break;
    case 'judgment':
      c.stage = 'judgment';
      step({ title: 'ارفع صك الحكم', detail: 'سأحلله وأحسب لك مهلة الاعتراض.', action: 'upload_document' });
      c.progress = Math.max(c.progress, 0.75);
      break;
  }

  c.timeline.push({ id: uid('t'), at: iso, kind: 'hearing', title: `الجلسة ${h.number}: ${RESULT_TEXT[input.result]}`, detail: note });
  c.updatedAt = iso;
  return c;
}
