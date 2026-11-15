import type { CaseType } from '@/api/types';
import { toLatinDigits } from '@/lib/phone';

/**
 * قراءة بيانات القضية من نص صفحة ناجز، على الجهاز فقط.
 * لا نعرف بنية صفحات ناجز ولا نعتمد عليها: نقرأ النص الظاهر ونستخرج منه بأنماط عامة،
 * ثم يراجع المستخدم كل حقل قبل الحفظ.
 */

export type ImportedDate = {
  /** ISO */
  at: string;
  /** كما ظهر في الصفحة */
  raw: string;
  /** هجري محوّل حسابيا، وقد يختلف يوما عن تقويم أم القرى */
  approximate: boolean;
};

export type NajizImport = {
  caseNumber?: string;
  court?: string;
  circuit?: string;
  type?: CaseType;
  hearings: ImportedDate[];
};

/** تحويل هجري إلى ميلادي بالتقويم الحسابي (قد يختلف يوما عن أم القرى). */
export function hijriToGregorian(hy: number, hm: number, hd: number): Date {
  const jd =
    Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
  // من اليوم اليولياني إلى ميلادي
  let l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return new Date(year, month - 1, day);
}

const umalqura = (() => {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return null;
  }
})();

/** يصحح التحويل الحسابي بمطابقته مع تقويم أم القرى إن توفر في الجهاز. */
export function hijriToGregorianExact(hy: number, hm: number, hd: number): { date: Date; exact: boolean } {
  const base = hijriToGregorian(hy, hm, hd);
  if (umalqura) {
    for (const delta of [0, -1, 1, -2, 2]) {
      const d = new Date(base);
      d.setDate(d.getDate() + delta);
      d.setHours(12);
      const parts = Object.fromEntries(umalqura.formatToParts(d).map((p) => [p.type, p.value]));
      if (Number(parts.year) === hy && Number(parts.month) === hm && Number(parts.day) === hd) {
        d.setHours(0);
        return { date: d, exact: true };
      }
    }
  }
  return { date: base, exact: false };
}

const TYPE_HINTS: [RegExp, CaseType][] = [
  [/عمال/, 'labor'],
  [/تجاري/, 'commercial'],
  [/أحوال شخصية|احوال شخصية/, 'personal_status'],
  [/تنفيذ/, 'execution'],
  [/جزائ/, 'criminal'],
];

function timeNear(text: string, index: number): { h: number; m: number } | null {
  const window = text.slice(index, index + 60);
  const t = window.match(/(\d{1,2}):(\d{2})\s*(ص|م|AM|PM|am|pm)?/);
  if (!t) return null;
  let h = Number(t[1]);
  const m = Number(t[2]);
  const suffix = t[3];
  if (suffix && /م|PM|pm/.test(suffix) && h < 12) h += 12;
  if (suffix && /ص|AM|am/.test(suffix) && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return { h, m };
}

export function parseNajizText(input: string, now = new Date()): NajizImport {
  const text = toLatinDigits(input).replace(/‏|‎/g, '');
  const out: NajizImport = { hearings: [] };

  const num = text.match(/رقم (?:القضية|الدعوى)\s*[:：]?\s*(\d{6,12})/) ?? text.match(/\b(4\d{9})\b/);
  if (num) out.caseNumber = num[1];

  const court = text.match(/(المحكمة [^\n،,:]{2,40}|محكمة [^\n،,:]{2,40})/);
  if (court) out.court = court[1].trim();

  const circuit = text.match(/(الدائرة [^\n،,:]{1,30})/);
  if (circuit) out.circuit = circuit[1].trim();

  for (const [re, type] of TYPE_HINTS) {
    if (re.test(out.court ?? '') || re.test(text.slice(0, 400))) {
      out.type = type;
      break;
    }
  }

  // تواريخ بصيغة يوم/شهر/سنة أو سنة/شهر/يوم، هجرية (14xx) أو ميلادية (20xx)
  const seen = new Set<string>();
  const dateRe = /\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b|\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g;
  for (const m of text.matchAll(dateRe)) {
    const [y, mo, d] = m[1] ? [m[1], m[2], m[3]].map(Number) : [m[6], m[5], m[4]].map(Number);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    let date: Date;
    let approximate = false;
    if (y >= 1400 && y <= 1500) {
      const h = hijriToGregorianExact(y, mo, d);
      date = h.date;
      approximate = !h.exact;
    } else if (y >= 2000 && y <= 2100) {
      date = new Date(y, mo - 1, d);
    } else continue;
    // الجلسات التي تهمنا هي القادمة فقط
    if (date.getTime() < now.getTime() - 86400000) continue;
    const time = timeNear(text, (m.index ?? 0) + m[0].length);
    date.setHours(time?.h ?? 9, time?.m ?? 0, 0, 0);
    const key = date.toISOString().slice(0, 10);
    if (seen.has(key)) continue;
    seen.add(key);
    out.hearings.push({ at: date.toISOString(), raw: m[0], approximate });
  }
  out.hearings.sort((a, b) => a.at.localeCompare(b.at));
  return out;
}

/** هل وجدنا ما يكفي لنعرضه؟ */
export const hasUsefulData = (r: NajizImport) => !!(r.caseNumber || r.court || r.hearings.length);

/** سكربت يُحقن في صفحة ناجز داخل التطبيق: يرسل النص الظاهر فقط إلى التطبيق، ولا يقرأ الكوكيز أو التخزين. */
export const READ_PAGE_SCRIPT = `
(function () {
  try {
    var text = (document.body && document.body.innerText) || '';
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'page', text: text.slice(0, 50000) }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
  }
})();
true;
`;
