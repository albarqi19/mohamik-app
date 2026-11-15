import { ApiError } from '../client';
import type { Case, NajizImportInput, NewDeadlineInput, NewHearingInput } from '../types';
import { DEFAULT_PREP } from './hearing-outcome';

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function assertFuture(iso: string, now: Date) {
  if (Number.isNaN(new Date(iso).getTime())) throw new ApiError('التاريخ غير صحيح', 422);
  if (new Date(iso).getTime() < now.getTime() - 86400000) throw new ApiError('التاريخ في الماضي', 422);
}

/** أقرب مهلة قادمة بين كل مهل القضية. */
function refreshNextDeadline(c: Case, now: Date) {
  const all = [...(c.deadlines ?? [])];
  if (c.nextDeadline && !all.some((d) => d.id === c.nextDeadline!.id)) all.push(c.nextDeadline);
  const upcoming = all.filter((d) => new Date(d.dueAt).getTime() >= now.getTime()).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  c.nextDeadline = upcoming[0] ?? c.nextDeadline;
}

/** مهلة يدخلها المستخدم: مؤكدة لأنها من مصدره، فتُذكَّر بها كاملة. */
export function addManualDeadline(c: Case, input: NewDeadlineInput, now = new Date()): Case {
  const title = input.title.trim();
  if (!title) throw new ApiError('اكتب عنوان المهلة', 422);
  assertFuture(input.dueAt, now);
  c.deadlines = [...(c.deadlines ?? []), { id: uid('d'), caseId: c.id, title, dueAt: input.dueAt, kind: input.kind, source: 'manual', confirmed: true }];
  refreshNextDeadline(c, now);
  c.timeline.push({ id: uid('t'), at: now.toISOString(), kind: 'note', title: `أضفت مهلة: ${title}` });
  c.updatedAt = now.toISOString();
  return c;
}

export function addManualHearing(c: Case, input: NewHearingInput, now = new Date()): Case {
  assertFuture(input.scheduledAt, now);
  const number = c.hearings.length ? Math.max(...c.hearings.map((h) => h.number)) + 1 : 1;
  c.hearings.push({
    id: uid('h'),
    caseId: c.id,
    number,
    scheduledAt: input.scheduledAt,
    mode: input.mode,
    location: input.location?.trim() || undefined,
    meetingUrl: input.meetingUrl?.trim() || undefined,
    status: 'scheduled',
    preparation: DEFAULT_PREP.map((label) => ({ id: uid('p'), label, done: false })),
  });
  const next = c.hearings
    .filter((h) => h.status === 'scheduled' && new Date(h.scheduledAt).getTime() >= now.getTime())
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  c.nextHearingAt = next?.scheduledAt ?? c.nextHearingAt;
  if (c.stage === 'assessment' || c.stage === 'drafting' || c.stage === 'filed') c.stage = 'hearings';
  c.nextSteps.unshift({ id: uid('s'), title: `جهّز للجلسة ${number}`, detail: 'قائمة تجهيز جاهزة لك.', dueAt: input.scheduledAt, action: 'prepare_hearing', done: false });
  c.timeline.push({ id: uid('t'), at: now.toISOString(), kind: 'hearing', title: `حُددت الجلسة ${number}` });
  c.updatedAt = now.toISOString();
  return c;
}

/** يطبق ما أكده المستخدم من ناجز: رقم القضية والمحكمة والجلسات الجديدة فقط (بلا تكرار لليوم نفسه). */
export function applyNajizImport(c: Case, input: NajizImportInput, now = new Date()): Case {
  if (input.caseNumber) c.caseNumber = input.caseNumber;
  if (input.court) c.court = { ...c.court, ...input.court };
  if (input.caseNumber && (c.stage === 'assessment' || c.stage === 'drafting')) c.stage = 'filed';
  const days = new Set(c.hearings.map((h) => h.scheduledAt.slice(0, 10)));
  let added = 0;
  for (const h of input.hearings) {
    if (days.has(h.scheduledAt.slice(0, 10)) || new Date(h.scheduledAt).getTime() < now.getTime()) continue;
    addManualHearing(c, h, now);
    days.add(h.scheduledAt.slice(0, 10));
    added++;
  }
  c.timeline.push({
    id: uid('t'),
    at: now.toISOString(),
    kind: 'note',
    title: 'استوردت بيانات القضية من ناجز',
    detail: added ? `أضيفت ${added === 1 ? 'جلسة واحدة' : added === 2 ? 'جلستان' : `${added} جلسات`}` : undefined,
  });
  c.updatedAt = now.toISOString();
  return c;
}
