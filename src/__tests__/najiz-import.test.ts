import { hijriToGregorian, hijriToGregorianExact, parseNajizText } from '@/features/najiz-import';

const now = new Date(2026, 10, 15);

describe('najiz import parser', () => {
  it('converts hijri to gregorian within a day', () => {
    // 1 رمضان 1447 ≈ 18 فبراير 2026 (أم القرى)
    const d = hijriToGregorian(1447, 9, 1);
    const target = new Date(2026, 1, 18).getTime();
    expect(Math.abs(d.getTime() - target)).toBeLessThanOrEqual(86400000);
  });

  it('matches umm al-qura exactly when Intl supports it', () => {
    const { date, exact } = hijriToGregorianExact(1447, 9, 1);
    if (exact) expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 1, 18]);
  });

  it('extracts case number, court, circuit, type and future hearings', () => {
    const text = `
      بيانات القضية
      رقم القضية: ٤٤٨١١٢٠٠٤٥
      المحكمة العمالية بالرياض، الدائرة العمالية الثالثة
      الجلسات
      2026/10/01 10:00 ص  منتهية
      2026/12/03 09:30 ص  مجدولة
      1448/07/01 11:00 ص
    `;
    const r = parseNajizText(text, now);
    expect(r.caseNumber).toBe('4481120045');
    expect(r.court).toBe('المحكمة العمالية بالرياض');
    expect(r.circuit).toBe('الدائرة العمالية الثالثة');
    expect(r.type).toBe('labor');
    expect(r.hearings).toHaveLength(2);
    const first = new Date(r.hearings[0].at);
    expect([first.getFullYear(), first.getMonth(), first.getDate(), first.getHours(), first.getMinutes()]).toEqual([2026, 11, 3, 9, 30]);
    expect(r.hearings[0].approximate).toBe(false);
    // يُطابَق مع أم القرى حين يتوفر في بيئة التشغيل
    const exact = hijriToGregorianExact(1448, 7, 1);
    expect(r.hearings[1].approximate).toBe(!exact.exact);
  });

  it('returns nothing useful for unrelated pages', () => {
    const r = parseNajizText('مرحبا بك في منصة ناجز، سجل الدخول عبر النفاذ الوطني', now);
    expect(r.caseNumber).toBeUndefined();
    expect(r.hearings).toHaveLength(0);
  });
});
