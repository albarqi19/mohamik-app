import type { CaseSummary } from '@/api/types';
import { normalizeArabic, searchCases, sortByUrgency } from '@/features/case-search';

const base: Omit<CaseSummary, 'id' | 'title'> = {
  type: 'labor',
  stage: 'hearings',
  userRole: 'plaintiff',
  opponentName: 'شركة الإنشاءات',
  updatedAt: '2026-11-01T00:00:00Z',
  progress: 0.4,
};
const day = (n: number) => new Date(Date.UTC(2026, 10, 15 + n)).toISOString();
const now = Date.UTC(2026, 10, 15);

describe('case search', () => {
  it('normalizes alef, ta marbuta, diacritics and digits', () => {
    expect(normalizeArabic('مُطالَبة  إخلاء ٤٤٨')).toBe('مطالبه اخلاء 448');
  });

  it('matches every word across title, opponent, number and type', () => {
    const cases: CaseSummary[] = [
      { ...base, id: '1', title: 'مطالبة بمستحقات نهاية الخدمة', caseNumber: '4481' },
      { ...base, id: '2', title: 'إخلاء عقار مستأجر', type: 'execution', opponentName: 'المستأجر' },
    ];
    expect(searchCases(cases, 'مستحقات').map((c) => c.id)).toEqual(['1']);
    expect(searchCases(cases, 'اخلاء').map((c) => c.id)).toEqual(['2']);
    expect(searchCases(cases, '٤٤٨١').map((c) => c.id)).toEqual(['1']);
    expect(searchCases(cases, 'عمالية الانشاءات').map((c) => c.id)).toEqual(['1']);
    expect(searchCases(cases, '  ')).toHaveLength(2);
  });

  it('sorts nearest hearing or deadline first, then most recently updated', () => {
    const cases: CaseSummary[] = [
      { ...base, id: 'none-old', title: 'a', updatedAt: '2026-10-01T00:00:00Z' },
      { ...base, id: 'hearing-10', title: 'b', nextHearingAt: day(10) },
      { ...base, id: 'none-new', title: 'c', updatedAt: '2026-11-10T00:00:00Z' },
      {
        ...base,
        id: 'deadline-2',
        title: 'd',
        nextDeadline: { id: 'x', caseId: 'd', title: 't', dueAt: day(2), kind: 'memo', source: 'court', confirmed: true } as unknown as CaseSummary['nextDeadline'],
      },
    ];
    expect(sortByUrgency(cases, now).map((c) => c.id)).toEqual(['deadline-2', 'hearing-10', 'none-new', 'none-old']);
  });
});
