import { CASE_STAGES } from '@/api/types';
import { mockApi, MOCK_OTP } from '@/api/mock/mock-api';
import { journeyStages, stageLabels } from '@/features/labels';

jest.setTimeout(20000);

describe('mock api', () => {
  test('OTP flow: rejects bad phone and code, accepts the mock code', async () => {
    await expect(mockApi.auth.requestOtp({ phone: '123' })).rejects.toThrow('رقم الجوال غير صحيح');
    const { requestId } = await mockApi.auth.requestOtp({ phone: '0551234567' });
    await expect(mockApi.auth.verifyOtp({ requestId, phone: '0551234567', code: '0000' })).rejects.toThrow();
    const session = await mockApi.auth.verifyOtp({ requestId, phone: '0551234567', code: MOCK_OTP });
    expect(session.token).toBeTruthy();
    expect(session.user.phone).toBe('0551234567');
  });

  test('every case has a known stage and consistent references', async () => {
    const list = await mockApi.cases.list();
    expect(list.length).toBeGreaterThan(0);
    for (const s of list) {
      expect(CASE_STAGES).toContain(s.stage);
      const c = await mockApi.cases.get(s.id);
      for (const h of c.hearings) {
        if (h.minuteId) expect(c.minutes.some((m) => m.id === h.minuteId)).toBe(true);
      }
      if (c.appeal?.memoId) expect(c.memos.some((m) => m.id === c.appeal!.memoId)).toBe(true);
      if (c.assessment) {
        expect(c.assessment.score).toBeGreaterThanOrEqual(0);
        expect(c.assessment.score).toBeLessThanOrEqual(100);
      }
    }
  });

  test('toggling a next step persists', async () => {
    const before = await mockApi.cases.get('case-1');
    const step = before.nextSteps[0];
    const after = await mockApi.cases.toggleNextStep('case-1', step.id);
    expect(after.nextSteps[0].done).toBe(!step.done);
  });

  test('creating a case returns an assessment and first steps', async () => {
    const c = await mockApi.cases.create({
      type: 'labor',
      userRole: 'plaintiff',
      opponentName: 'شركة',
      title: 'رواتب متأخرة',
      description: 'لم تصرف رواتبي منذ ثلاثة أشهر رغم المطالبة',
      claimAmount: 24000,
    });
    expect(c.stage).toBe('assessment');
    expect(c.assessment?.claims[0].amount).toBe(24000);
    expect(c.nextSteps.length).toBeGreaterThan(0);
    const list = await mockApi.cases.list();
    expect(list.some((x) => x.id === c.id)).toBe(true);
  });

  test('assistant answers appeal questions with a citation', async () => {
    const res = await mockApi.assistant.ask({ message: 'كم مدة الاعتراض؟' });
    expect(res.message.role).toBe('assistant');
    expect(res.message.citations?.length).toBeGreaterThan(0);
    const followUp = await mockApi.assistant.ask({ conversationId: res.conversationId, message: 'شكراً' });
    expect(followUp.conversationId).toBe(res.conversationId);
  });

  test('referral request is recorded on the timeline', async () => {
    const r = await mockApi.referrals.request('case-2');
    expect(r.status).toBe('requested');
    const c = await mockApi.cases.get('case-2');
    expect(c.timeline.some((e) => e.title.includes('محامٍ من الرائد'))).toBe(true);
  });
});

describe('labels', () => {
  test('every stage has a label, journey stages are ordered', () => {
    for (const s of CASE_STAGES) expect(stageLabels[s]).toBeTruthy();
    const idx = journeyStages.map((s) => CASE_STAGES.indexOf(s));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
});
