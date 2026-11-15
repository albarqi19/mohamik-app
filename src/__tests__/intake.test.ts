import { detectType, extractAmount, extractYears, intakeNext } from '@/api/mock/intake';

describe('intake extraction', () => {
  test('detects case type from the story', () => {
    expect(detectType('اشتغلت ٦ سنوات في شركة مقاولات وأنهوا عقدي')).toBe('labor');
    expect(detectType('أطالب بنفقة الأبناء')).toBe('personal_status');
    expect(detectType('المستأجر لم يدفع الإيجار')).toBe('execution');
    expect(detectType('وردت مواد بفواتير ولم يسدد')).toBe('commercial');
    expect(detectType('شيء آخر')).toBe('general');
  });

  test('extracts years and amounts in Arabic and Latin digits', () => {
    expect(extractYears('اشتغلت ٦ سنوات')).toBe(6);
    expect(extractYears('عملت 7 سنوات')).toBe(7);
    expect(extractYears('عملت ثلاث سنوات')).toBe(3);
    expect(extractAmount('٤٥ ألف')).toBe(45000);
    expect(extractAmount('120,000 ريال')).toBe(120000);
    expect(extractAmount('لا أعرف بعد')).toBeUndefined();
  });
});

describe('intake flow', () => {
  test('walks from story to a ready case draft', () => {
    let t = intakeNext(undefined, undefined);
    expect(t.done).toBe(false);
    t = intakeNext(t.sessionId, 'اشتغلت ٦ سنوات في شركة مقاولات وأنهوا عقدي برسالة واتساب');
    expect(t.facts.find((f) => f.label === 'نوع القضية')?.value).toBe('عمالية');
    expect(t.tip).toBeTruthy();
    expect(t.options?.length).toBe(2);
    t = intakeNext(t.sessionId, 'أنا صاحب المطالبة');
    t = intakeNext(t.sessionId, 'شركة الأفق');
    expect(t.options).toContain('غير محدد المدة');
    t = intakeNext(t.sessionId, 'غير محدد المدة');
    t = intakeNext(t.sessionId, '68 ألف');
    expect(t.done).toBe(true);
    expect(t.draft).toMatchObject({ type: 'labor', userRole: 'plaintiff', opponentName: 'شركة الأفق', claimAmount: 68000 });
  });

  test('defendant role is detected', () => {
    let t = intakeNext(undefined, undefined);
    t = intakeNext(t.sessionId, 'رفعوا علي دعوى بقيمة توريد');
    t = intakeNext(t.sessionId, 'رُفعت عليّ دعوى');
    expect(t.facts.find((f) => f.label === 'صفتك')?.value).toBe('مدعى عليه');
  });
});
