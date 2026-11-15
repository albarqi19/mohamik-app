import type { Case } from '@/api/types';
import { caseTypeLabels, roleLabels } from '@/features/labels';
import { formatMoney } from '@/lib/format';

export const NAJIZ_URL = 'https://najiz.sa';

export type FilingStep = { id: string; title: string; detail: string };

/** خطوات عامة لرفع الدعوى. المسميات داخل ناجز قد تتغير، فنصفها وصفا لا مسارا حرفيا. */
export function filingSteps(c: Pick<Case, 'type'>): FilingStep[] {
  const steps: FilingStep[] = [
    { id: 'login', title: 'ادخل إلى ناجز', detail: 'سجّل الدخول عبر النفاذ الوطني الموحد بهويتك.' },
    {
      id: 'service',
      title: 'اختر خدمة صحيفة الدعوى',
      detail: `ابحث عن خدمة رفع أو تقديم صحيفة دعوى، واختر نوعها: ${caseTypeLabels[c.type]}.`,
    },
    { id: 'parties', title: 'أدخل بيانات الأطراف', detail: 'بياناتك وبيانات الطرف الآخر كما في الهوية أو السجل التجاري.' },
    { id: 'statement', title: 'الصق نص الدعوى والطلبات', detail: 'انسخ الملخص الجاهز من الأسفل والصقه في حقل الوقائع والطلبات، وراجعه قبل الإرسال.' },
    { id: 'attachments', title: 'أرفق المستندات', detail: 'العقد، والمراسلات، وأي إثبات ذكرناه في التقييم. صور واضحة بصيغة PDF أفضل.' },
    { id: 'submit', title: 'أرسل واحفظ رقم الطلب', detail: 'بعد الإرسال أضف رقم القضية هنا لنتابع معك المواعيد والجلسات.' },
  ];
  if (c.type === 'execution') {
    steps[1] = {
      id: 'service',
      title: 'اختر خدمة طلب التنفيذ',
      detail: 'طلب التنفيذ يقدم لمحكمة التنفيذ ويحتاج سندا تنفيذيا، مثل عقد إيجار موثق أو حكم نهائي.',
    };
  }
  if (c.type === 'labor') {
    steps.splice(1, 0, {
      id: 'amicable',
      title: 'تأكد من التسوية الودية أولا',
      detail: 'القضايا العمالية تمر عادة بمرحلة التسوية الودية في وزارة الموارد البشرية قبل المحكمة العمالية.',
    });
  }
  return steps;
}

/** نص جاهز للصق في ناجز: الوقائع والطلبات. يبقى على الجهاز ولا يرسل لأي خدمة. */
export function filingStatement(c: Case): string {
  const draft = c.memos.find((m) => m.kind === 'statement_of_claim');
  if (draft) return draft.body.trim();
  const me = roleLabels[c.userRole];
  const lines = [`نوع الدعوى: ${caseTypeLabels[c.type]}`, `صفتي: ${me}`, '', 'الوقائع:', c.description.trim()];
  const claims = c.assessment?.claims ?? [];
  if (claims.length) {
    lines.push('', 'الطلبات:');
    claims.forEach((cl, i) => lines.push(`${i + 1}. ${cl.label}: ${formatMoney(cl.amount)}`));
  } else if (c.claimAmount) {
    lines.push('', `الطلبات: إلزام المدعى عليه بمبلغ ${formatMoney(c.claimAmount)}`);
  }
  return lines.join('\n');
}
