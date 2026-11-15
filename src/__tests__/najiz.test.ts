import { mockApi } from '@/api/mock/mock-api';
import { filingStatement, filingSteps } from '@/features/najiz';

describe('najiz guide', () => {
  it('adds the amicable settlement step for labor cases only', async () => {
    const labor = await mockApi.cases.get('case-1');
    const other = await mockApi.cases.get('case-3');
    expect(filingSteps(labor).some((s) => s.id === 'amicable')).toBe(true);
    expect(filingSteps(other).some((s) => s.id === 'amicable')).toBe(false);
    expect(filingSteps(labor)[0].id).toBe('login');
  });

  it('builds a statement with facts and numbered claims', async () => {
    const c = await mockApi.cases.get('case-4');
    const text = filingStatement({ ...c, memos: [] });
    expect(text).toContain('الوقائع:');
    expect(text).toContain(c.description.trim());
    if (c.assessment?.claims.length) expect(text).toContain('1. ');
  });

  it('prefers an existing statement-of-claim draft', async () => {
    const c = await mockApi.cases.get('case-4');
    const memo = { id: 'm', caseId: c.id, kind: 'statement_of_claim' as const, title: 't', status: 'draft' as const, updatedAt: '', body: '  نص اللائحة  ', generatedByAI: true, citations: [] };
    expect(filingStatement({ ...c, memos: [memo] })).toBe('نص اللائحة');
  });

  it('exports account data', async () => {
    const data = (await mockApi.account.exportData()) as { cases: unknown[] };
    expect(data.cases.length).toBeGreaterThan(0);
  });
});
