import { buildMockCases } from '@/api/mock/data';
import { addManualDeadline, addManualHearing, applyNajizImport } from '@/api/mock/manual-dates';

const get = (id: string) => buildMockCases().find((c) => c.id === id)!;
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

describe('manual dates', () => {
  it('adds a confirmed manual deadline and makes it next when it is sooner', () => {
    const c = addManualDeadline(get('case-4'), { title: ' تقديم مذكرة ', dueAt: inDays(1), kind: 'memo_submission' });
    const d = c.deadlines!.at(-1)!;
    expect(d).toMatchObject({ title: 'تقديم مذكرة', source: 'manual', confirmed: true });
    expect(c.nextDeadline?.id).toBe(d.id);
  });

  it('keeps an earlier existing deadline as next', () => {
    const c0 = get('case-1');
    const before = c0.nextDeadline!;
    const c = addManualDeadline(c0, { title: 'رسوم', dueAt: inDays(60), kind: 'other' });
    expect(c.nextDeadline?.id).toBe(before.id);
  });

  it('rejects an empty title or a past date', () => {
    expect(() => addManualDeadline(get('case-4'), { title: ' ', dueAt: inDays(3), kind: 'other' })).toThrow('عنوان');
    expect(() => addManualDeadline(get('case-4'), { title: 'x', dueAt: inDays(-5), kind: 'other' })).toThrow('الماضي');
  });

  it('adds a hearing with prep, a step, and moves early stages to hearings', () => {
    const c = addManualHearing(get('case-4'), { scheduledAt: inDays(10), mode: 'remote', meetingUrl: ' ' });
    const h = c.hearings.at(-1)!;
    expect(h.number).toBe(1);
    expect(h.meetingUrl).toBeUndefined();
    expect(h.preparation.length).toBeGreaterThan(0);
    expect(c.stage).toBe('hearings');
    expect(c.nextHearingAt).toBe(h.scheduledAt);
    expect(c.nextSteps[0].action).toBe('prepare_hearing');
  });
});

describe('najiz import apply', () => {
  it('sets number and court, adds only new future hearings, moves to filed', () => {
    const c0 = get('case-4');
    const at = inDays(9);
    const c = applyNajizImport(c0, {
      caseNumber: '4470001111',
      court: { name: 'محكمة التنفيذ بالرياض', city: 'الرياض' },
      hearings: [
        { scheduledAt: at, mode: 'remote' },
        { scheduledAt: at, mode: 'remote' },
        { scheduledAt: inDays(-3), mode: 'remote' },
      ],
    });
    expect(c.caseNumber).toBe('4470001111');
    expect(c.court?.name).toBe('محكمة التنفيذ بالرياض');
    expect(c.hearings).toHaveLength(1);
    expect(c.stage).toBe('hearings');
    expect(c.timeline.at(-1)?.detail).toBe('أضيفت جلسة واحدة');
  });
});
