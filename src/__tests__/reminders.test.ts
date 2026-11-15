import { planReminders } from '@/lib/reminders';

const now = new Date('2026-11-14T12:00:00Z');
const inDays = (d: number, h = 12) => new Date(now.getTime() + d * 86400000 + (h - 12) * 3600000).toISOString();

describe('planReminders', () => {
  const hearings = [
    { id: 'h1', caseId: 'c1', scheduledAt: inDays(3, 9), status: 'scheduled' as const },
    { id: 'h2', caseId: 'c1', scheduledAt: inDays(-3), status: 'held' as const },
  ];
  const deadlines = [
    { id: 'd1', caseId: 'c1', dueAt: inDays(10), confirmed: true },
    { id: 'd2', caseId: 'c2', dueAt: inDays(10), confirmed: false },
  ];

  test('schedules hearing reminders a day and an hour before, skipping past hearings', () => {
    const plan = planReminders(hearings, [], { hearings: true, deadlines: true, now });
    expect(plan.map((p) => p.id)).toEqual(['h-h1-1d', 'h-h1-1h']);
    expect(plan[0].url).toBe('/case/c1/hearing/h1');
  });

  test('never reminds about an unconfirmed deadline', () => {
    const plan = planReminders([], deadlines, { hearings: true, deadlines: true, now });
    expect(plan.every((p) => p.id.startsWith('d-d1'))).toBe(true);
    expect(plan).toHaveLength(2);
  });

  test('respects settings', () => {
    expect(planReminders(hearings, deadlines, { hearings: false, deadlines: false, now })).toHaveLength(0);
  });

  test('notification text never contains case details', () => {
    const plan = planReminders(hearings, deadlines, { hearings: true, deadlines: true, now });
    for (const p of plan) {
      expect(p.title + p.body).not.toMatch(/c1|c2|h1|d1/);
    }
  });

  test('drops reminders whose time already passed', () => {
    const soon = [{ id: 'h3', caseId: 'c1', scheduledAt: new Date(now.getTime() + 30 * 60000).toISOString(), status: 'scheduled' as const }];
    expect(planReminders(soon, [], { hearings: true, deadlines: true, now })).toHaveLength(0);
  });
});
