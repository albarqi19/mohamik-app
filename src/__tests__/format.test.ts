import { addDays, daysPhrase, daysUntil, formatMoney, relativeDays } from '@/lib/format';

describe('format', () => {
  const now = new Date();

  test('daysUntil counts calendar days', () => {
    expect(daysUntil(now.toISOString())).toBe(0);
    expect(daysUntil(addDays(now.toISOString(), 3))).toBe(3);
    expect(daysUntil(addDays(now.toISOString(), -2))).toBe(-2);
  });

  test('relativeDays uses correct Arabic forms', () => {
    const iso = (d: number) => addDays(now.toISOString(), d);
    expect(relativeDays(iso(0))).toBe('اليوم');
    expect(relativeDays(iso(1))).toBe('غداً');
    expect(relativeDays(iso(2))).toBe('بعد يومين');
    expect(relativeDays(iso(5))).toBe('بعد 5 أيام');
    expect(relativeDays(iso(21))).toBe('بعد 21 يوماً');
    expect(relativeDays(iso(-3))).toBe('قبل 3 أيام');
  });

  test('daysPhrase', () => {
    expect(daysPhrase(1)).toBe('يوم واحد');
    expect(daysPhrase(2)).toBe('يومان');
    expect(daysPhrase(10)).toBe('10 أيام');
    expect(daysPhrase(11)).toBe('11 يوماً');
  });

  test('formatMoney uses Latin digits and riyal suffix', () => {
    expect(formatMoney(67500)).toMatch(/^67.500 ر\.س$/);
  });
});
