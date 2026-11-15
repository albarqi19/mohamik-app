import type { CaseType, IntakeFact, IntakeTurn, NewCaseInput, PartyRole } from '../types';

/**
 * محاكاة البداية الذكية: أسئلة موجّهة واستخراج وقائع بسيط بالكلمات المفتاحية.
 * المحرك الحقيقي في الخلفية يستعمل النموذج مع أنظمة وسوابق الرائد.
 */

type Session = {
  id: string;
  step: number;
  story?: string;
  type?: CaseType;
  role?: PartyRole;
  opponent?: string;
  detail?: string;
  amount?: number;
  facts: IntakeFact[];
};

const sessions = new Map<string, Session>();
const TOTAL = 6;

const normalize = (t: string) =>
  t
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه');

const WORD_NUMBERS: Record<string, number> = {
  سنه: 1, سنتين: 2, ثلاث: 3, اربع: 4, خمس: 5, ست: 6, سبع: 7, ثمان: 8, تسع: 9, عشر: 10,
};

export function detectType(story: string): CaseType {
  const t = normalize(story);
  if (/(راتب|رواتب|فصل|انهاء عقد|انهوا عقدي|مكافاه|نهايه الخدمه|كفيل|شركه|عملت|اشتغلت|وظيف)/.test(t)) return 'labor';
  if (/(نفقه|حضانه|طلاق|زيارة|زياره|خلع|زوج)/.test(t)) return 'personal_status';
  if (/(مستاجر|ايجار|اخلاء|شيك|سند لامر|حكم صادر|تنفيذ)/.test(t)) return 'execution';
  if (/(توريد|فاتوره|فواتير|شريك|شراكه|عقد تجاري|مؤسسه)/.test(t)) return 'commercial';
  if (/(وزاره|جهه حكوميه|بلديه|قرار اداري)/.test(t)) return 'administrative';
  return 'general';
}

export function extractYears(story: string): number | undefined {
  const t = normalize(story);
  const digit = t.match(/(\d+)\s*(سنوات|سنه|سنين|عام|اعوام)/);
  if (digit) return Number(digit[1]);
  for (const [w, n] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`${w}\\s*(سنوات|سنين)`).test(t) || (n <= 2 && t.includes(w))) return n;
  }
  return undefined;
}

export function extractAmount(text: string): number | undefined {
  const t = normalize(text).replace(/[,،٬]/g, '');
  const m = t.match(/(\d+(?:\.\d+)?)\s*(الف|الاف)?/);
  if (!m) return undefined;
  return Math.round(Number(m[1]) * (m[2] ? 1000 : 1)) || undefined;
}

const TYPE_LABEL: Record<CaseType, string> = {
  labor: 'عمالية',
  commercial: 'تجارية',
  personal_status: 'أحوال شخصية',
  general: 'عامة',
  administrative: 'إدارية',
  criminal: 'جزائية',
  execution: 'تنفيذ',
};

const uid = () => `intake-${Math.random().toString(36).slice(2, 9)}`;

function turn(s: Session, messages: string[], extra: Partial<IntakeTurn> = {}): IntakeTurn {
  return { sessionId: s.id, messages, facts: [...s.facts], step: s.step, totalSteps: TOTAL, done: false, ...extra };
}

function setFact(s: Session, label: string, value: string) {
  const i = s.facts.findIndex((f) => f.label === label);
  if (i >= 0) s.facts[i] = { label, value };
  else s.facts.push({ label, value });
}

export function intakeNext(sessionId: string | undefined, answer: string | undefined): IntakeTurn {
  let s = sessionId ? sessions.get(sessionId) : undefined;
  if (!s) {
    s = { id: uid(), step: 0, facts: [] };
    sessions.set(s.id, s);
    return turn(s, ['احكِ لي ما حدث بكلماتك، ولا تقلق من الترتيب. أنا أرتّب.']);
  }
  const a = (answer ?? '').trim();

  switch (s.step) {
    case 0: {
      s.story = a;
      s.type = detectType(a);
      setFact(s, 'نوع القضية', TYPE_LABEL[s.type]);
      const years = extractYears(a);
      if (years) setFact(s, 'المدة', `${years} ${years <= 10 ? 'سنوات' : 'سنة'}`);
      if (/(واتس|رساله|رسالة)/.test(normalize(a))) setFact(s, 'الإثبات', 'رسالة مكتوبة');
      s.step = 1;
      return turn(s, ['فهمت. هذا ما سجّلته، صحّحني إن أخطأت.', 'ما صفتك في هذا النزاع؟'], {
        options: ['أنا صاحب المطالبة', 'رُفعت عليّ دعوى'],
        tip: s.facts.some((f) => f.label === 'الإثبات') ? 'احتفظ بلقطة الرسالة، فهي دليلك الأهم.' : undefined,
      });
    }
    case 1: {
      s.role = /رفعت|علي|عليّ|مدعى/.test(a) ? 'defendant' : 'plaintiff';
      setFact(s, 'صفتك', s.role === 'plaintiff' ? 'مدعٍ' : 'مدعى عليه');
      s.step = 2;
      return turn(s, ['من الطرف الآخر؟ اكتب اسم الشركة أو الشخص.'], {
        tip: 'الأسماء تبقى في حسابك فقط، ولا تُرسل لمحرك الذكاء الاصطناعي.',
      });
    }
    case 2: {
      s.opponent = a || 'الطرف الآخر';
      setFact(s, 'الطرف الآخر', s.opponent);
      s.step = 3;
      if (s.type === 'labor') {
        return turn(s, ['هل عقدك محدد المدة أم غير محدد؟ يتغير بذلك حساب التعويض.'], {
          options: ['غير محدد المدة', 'محدد المدة', 'لا أعرف'],
        });
      }
      return turn(s, ['هل لديك مستندات تثبت ما ذكرته؟ (عقد، فواتير، مراسلات)'], {
        options: ['نعم، كلها', 'بعضها', 'لا يوجد'],
      });
    }
    case 3: {
      s.detail = a;
      setFact(s, s.type === 'labor' ? 'نوع العقد' : 'المستندات', a);
      s.step = 4;
      return turn(s, [s.role === 'defendant' ? 'كم المبلغ المطالب به ضدك تقريباً؟' : 'كم المبلغ الذي تطالب به تقريباً؟'], {
        options: ['لا أعرف بعد'],
      });
    }
    case 4: {
      s.amount = extractAmount(a);
      if (s.amount) setFact(s, 'المبلغ', `${s.amount.toLocaleString('en-US')} ريال`);
      s.step = 5;
      const draft: NewCaseInput = {
        type: s.type ?? 'general',
        userRole: s.role ?? 'plaintiff',
        opponentName: s.opponent ?? 'الطرف الآخر',
        title: titleFor(s),
        description: s.story ?? '',
        claimAmount: s.amount,
      };
      return turn(s, ['اكتمل ملف القضية الأولي. راجع ما فهمته، ثم أنشئ القضية لأقيّم موقفك وأرتّب خطواتك.'], {
        done: true,
        draft,
        step: TOTAL,
      });
    }
    default:
      return turn(s, ['الملف مكتمل.'], { done: true, step: TOTAL });
  }
}

function titleFor(s: Session): string {
  switch (s.type) {
    case 'labor':
      return 'مطالبة بمستحقات عمالية';
    case 'personal_status':
      return 'قضية أحوال شخصية';
    case 'execution':
      return 'طلب تنفيذ';
    case 'commercial':
      return 'مطالبة تجارية';
    case 'administrative':
      return 'دعوى إدارية';
    default:
      return 'مطالبة';
  }
}
