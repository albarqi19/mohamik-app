import type { CaseSummary } from '@/api/types';
import { caseTypeLabels, stageLabels } from '@/features/labels';
import { toLatinDigits } from '@/lib/phone';

/** توحيد النص العربي للبحث: يحذف التشكيل والتطويل ويوحد الألف والتاء المربوطة والياء والأرقام. */
export function normalizeArabic(s: string): string {
  return toLatinDigits(s)
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function haystack(c: CaseSummary): string {
  return normalizeArabic(
    [c.title, c.opponentName, c.caseNumber, c.court?.name, c.court?.city, caseTypeLabels[c.type], stageLabels[c.stage]]
      .filter(Boolean)
      .join(' '),
  );
}

/** كل كلمة في البحث يجب أن تظهر في بيانات القضية. */
export function searchCases(cases: CaseSummary[], query: string): CaseSummary[] {
  const words = normalizeArabic(query).split(' ').filter(Boolean);
  if (!words.length) return cases;
  return cases.filter((c) => {
    const h = haystack(c);
    return words.every((w) => h.includes(w));
  });
}

/** أقرب موعد يحتاج انتباهك: مهلة أو جلسة. */
function nextAttention(c: CaseSummary, now: number): number {
  const times = [c.nextDeadline?.dueAt, c.nextHearingAt]
    .filter((x): x is string => !!x)
    .map((x) => new Date(x).getTime())
    .filter((t) => t >= now - 86400000);
  return times.length ? Math.min(...times) : Number.POSITIVE_INFINITY;
}

/** ترتيب القضايا: الأقرب موعدا أولا، ثم الأحدث تحديثا. */
export function sortByUrgency(cases: CaseSummary[], now = Date.now()): CaseSummary[] {
  return cases
    .map((c) => ({ c, t: nextAttention(c, now) }))
    .sort((a, b) => {
      if (a.t !== b.t) return a.t < b.t ? -1 : 1;
      return b.c.updatedAt.localeCompare(a.c.updatedAt);
    })
    .map((x) => x.c);
}
