/** أدوات تنسيق التواريخ والأرقام بالعربية (هجري وميلادي). */

const gregorian = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const weekdayTime = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
  weekday: 'long',
  hour: 'numeric',
  minute: '2-digit',
});

const time = new Intl.DateTimeFormat('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' });

export function formatDate(iso: string): string {
  try {
    return gregorian.format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function formatHijri(iso: string): string {
  try {
    return hijri.format(new Date(iso));
  } catch {
    return '';
  }
}

const weekdayOnly = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long' });

export function formatWeekday(iso: string): string {
  try {
    return weekdayOnly.format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatWeekdayTime(iso: string): string {
  try {
    return weekdayTime.format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatTime(iso: string): string {
  try {
    return time.format(new Date(iso));
  } catch {
    return '';
  }
}

const DAY = 24 * 60 * 60 * 1000;

/** عدد الأيام المتبقية حتى تاريخ معيّن (سالب إن فات). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso);
  const a = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b - a) / DAY);
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString();
}

/** صيغة عربية سليمة لعدد الأيام: يوم، يومان، 3 أيام، 11 يوماً. */
export function daysPhrase(n: number, { accusative = false } = {}): string {
  if (n === 1) return 'يوم واحد';
  if (n === 2) return accusative ? 'يومين' : 'يومان';
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

/** كلمة الوحدة فقط بعد رقم معروض منفصلاً (لعداد المهلة). */
export function daysUnit(n: number): string {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومان';
  if (n >= 3 && n <= 10) return 'أيام';
  return 'يوماً';
}

export function relativeDays(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غداً';
  if (d === -1) return 'أمس';
  if (d === 2) return 'بعد يومين';
  if (d === -2) return 'قبل يومين';
  return d > 0 ? `بعد ${daysPhrase(d)}` : `قبل ${daysPhrase(-d)}`;
}

const money = new Intl.NumberFormat('ar-SA-u-nu-latn', { maximumFractionDigits: 0 });

/** مبلغ بالريال: 67,500 ر.س */
export function formatMoney(amount: number): string {
  return `${money.format(amount)} ر.س`;
}

/** هل مضى هذا الموعد؟ */
export function isPast(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}
