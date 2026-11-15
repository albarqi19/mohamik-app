import { applyHearingOutcome } from '@/api/mock/hearing-outcome';
import { buildMockCases } from '@/api/mock/data';
import { mockApi } from '@/api/mock/mock-api';

const case3 = () => buildMockCases().find((c) => c.id === 'case-3')!;
const in14 = new Date(Date.now() + 14 * 86400000).toISOString();

describe('hearing outcome', () => {
  it('postponed: closes the hearing, schedules the next with a prep list, moves to hearings stage', () => {
    const c = applyHearingOutcome(case3(), 'h-31', { result: 'postponed', nextAt: in14, note: 'طلب كشف حساب' });
    const [first, second] = c.hearings;
    expect(first.status).toBe('held');
    expect(first.outcome).toContain('طلب كشف حساب');
    expect(second.number).toBe(2);
    expect(second.status).toBe('scheduled');
    expect(second.preparation.length).toBeGreaterThan(0);
    expect(c.nextHearingAt).toBe(in14);
    expect(c.stage).toBe('hearings');
    expect(c.nextSteps.find((s) => s.action === 'record_outcome')?.done).toBe(true);
    expect(c.nextSteps[0].action).toBe('upload_document');
  });

  it('requires a date when postponed', () => {
    expect(() => applyHearingOutcome(case3(), 'h-31', { result: 'postponed' })).toThrow('حدد موعد');
  });

  it('reserved: stage reserved, optional pronouncement hearing without prep', () => {
    const c = applyHearingOutcome(case3(), 'h-31', { result: 'reserved', nextAt: in14 });
    expect(c.stage).toBe('reserved');
    expect(c.hearings[1].agenda).toBe('جلسة النطق بالحكم');
    expect(c.hearings[1].preparation).toHaveLength(0);
  });

  it('judgment: asks to upload the judgment deed', () => {
    const c = applyHearingOutcome(case3(), 'h-31', { result: 'judgment' });
    expect(c.stage).toBe('judgment');
    expect(c.nextHearingAt).toBeUndefined();
    expect(c.nextSteps[0].title).toContain('صك الحكم');
  });

  it('cannot record twice', () => {
    const c = applyHearingOutcome(case3(), 'h-31', { result: 'judgment' });
    expect(() => applyHearingOutcome(c, 'h-31', { result: 'judgment' })).toThrow();
  });

  it('lists past hearings awaiting an outcome', async () => {
    const list = await mockApi.cases.awaitingOutcome();
    expect(list.map((h) => h.id)).toContain('h-31');
  });
});
