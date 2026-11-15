import { ApiError } from '../client';
import type { Api } from '../services/contracts';
import type { Case, CaseDocument, CaseSummary, ChatMessage, Citation, Deadline, Memo } from '../types';
import { memoKindLabels, stageLabels } from '@/features/labels';

import { applyHearingOutcome } from './hearing-outcome';
import { intakeNext } from './intake';
import { buildMockCases, buildMockNotifications, citations } from './data';

/** تطبيق تجريبي يعمل في الذاكرة، يحاكي زمن الشبكة. */

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const db = {
  cases: buildMockCases(),
  notifications: buildMockNotifications(),
  conversations: new Map<string, ChatMessage[]>(),
};

export const MOCK_OTP = '1234';

const toSummary = (c: Case): CaseSummary => ({
  id: c.id,
  title: c.title,
  caseNumber: c.caseNumber,
  type: c.type,
  stage: c.stage,
  userRole: c.userRole,
  court: c.court,
  opponentName: c.opponentName,
  nextHearingAt: c.nextHearingAt,
  nextDeadline: c.nextDeadline,
  updatedAt: c.updatedAt,
  progress: c.progress,
});

/** كل مهل القضية بلا تكرار (المهلة القادمة + المستخرجة). */
function allDeadlines(c: Case): Deadline[] {
  const list = [...(c.deadlines ?? [])];
  if (c.nextDeadline && !list.some((d) => d.id === c.nextDeadline!.id)) list.unshift(c.nextDeadline);
  return list;
}

function findCase(id: string): Case {
  const c = db.cases.find((x) => x.id === id);
  if (!c) throw new ApiError('القضية غير موجودة', 404);
  return c;
}

/** ردود تجريبية مبنية على الكلمات المفتاحية، حتى يُربط محرك الرائد. */
function mockAnswer(message: string, c?: Case): { content: string; citations: Citation[] } {
  const m = message.replace(/[أإآ]/g, 'ا');
  const suffix = '\n\n(رد تجريبي، سيُستبدل بإجابات محرك الرائد المبنية على الأنظمة والسوابق)';

  if (m.includes('اعتراض') || m.includes('استئناف')) {
    const left = c?.judgment
      ? Math.max(0, Math.round((new Date(c.judgment.appealDeadline).getTime() - Date.now()) / 86400000))
      : undefined;
    return {
      content:
        'مدة الاعتراض بطلب الاستئناف ثلاثون يوماً تبدأ من تاريخ تسلّم صك الحكم.' +
        (left !== undefined ? ` في قضيتك بقي ${left} يوماً تقريباً.` : '') +
        '\n\nأقترح أن تبني لائحتك على: 1) الوقائع التي أغفلها الحكم، 2) قصور التسبيب، 3) الطلبات المحددة.' +
        suffix,
      citations: [citations.procedure187],
    };
  }
  if (m.includes('مكافاه') || m.includes('نهايه الخدمه') || m.includes('عمال')) {
    return {
      content:
        'تُحسب مكافأة نهاية الخدمة بأجر نصف شهر عن كل سنة من السنوات الخمس الأولى، وأجر شهر عن كل سنة بعدها، على أساس آخر أجر.\n\nمثال لسبع سنوات بأجر 15,000: (5 × 7,500) + (2 × 15,000) = 67,500 ريال.' +
        suffix,
      citations: [citations.labor84, citations.precedentLabor],
    };
  }
  if (m.includes('لخص') || m.includes('ملخص')) {
    return {
      content: c
        ? `ملخص القضية "${c.title}":\n• المرحلة الحالية: ${stageLabels[c.stage]}\n• الخصم: ${c.opponentName}\n• عدد الجلسات: ${c.hearings.length}\n• المذكرات: ${c.memos.length}\n\nأهم ما ينتظرك: ${c.nextSteps.find((s) => !s.done)?.title ?? 'لا توجد خطوات معلقة'}.` + suffix
        : 'افتح قضية ثم اسألني عن ملخصها، أو اكتب تفاصيل القضية هنا.' + suffix,
      citations: [],
    };
  }
  if (m.includes('جلسه') || m.includes('استعد') || m.includes('تحضير')) {
    return {
      content:
        'للاستعداد للجلسة:\n1) راجع آخر محضر وطلبات المحكمة فيه.\n2) جهّز ردك على دفوع الخصم في نقاط قصيرة.\n3) رتّب المستندات بأرقام ليسهل الإشارة إليها.\n4) في الجلسات عن بعد اختبر الاتصال قبل الموعد بربع ساعة.' +
        suffix,
      citations: [],
    };
  }
  return {
    content:
      'فهمت سؤالك. سأحلله على ضوء الأنظمة السعودية والسوابق القضائية وأعطيك الخطوات العملية. لكي تكون الإجابة أدق، اذكر: نوع القضية، صفتك فيها، وأهم التواريخ.' +
      suffix,
    citations: [],
  };
}

const DAY_MS = 86400000;

/** قراءة تجريبية: المحرك الحقيقي يستخرج النص (OCR) ثم يحلله. */
function mockExtraction(c: Case, doc: CaseDocument): CaseDocument['extraction'] & object {
  const base = Date.now();
  if (doc.kind === 'judgment') {
    return {
      kind: 'judgment',
      summary: 'صك حكم (قراءة تجريبية): قضت الدائرة بإلزام المدعى عليه بجزء من المطالبة ورفض الباقي.',
      keyPoints: ['الحكم ابتدائي وقابل للاعتراض', 'منطوق الحكم يحتاج مراجعتك للتأكد من المبالغ'],
      requests: [],
      deadlines: [
        {
          id: uid('d'),
          caseId: c.id,
          title: 'آخر موعد للاعتراض (محسوب من تاريخ الرفع)',
          dueAt: new Date(base + 30 * DAY_MS).toISOString(),
          kind: 'appeal',
          source: 'computed',
          confirmed: false,
        },
      ],
    };
  }
  if (doc.kind === 'minute') {
    return {
      kind: 'minute',
      summary: 'محضر جلسة (قراءة تجريبية): حضر الطرفان، وطلبت الدائرة من المدعي تقديم ما يثبت دعواه، وأُجّلت الجلسة.',
      keyPoints: ['أُجّلت الجلسة لموعد يحدد لاحقاً', 'المحكمة طلبت مستندات إضافية'],
      requests: ['تقديم المستندات المؤيدة للدعوى'],
      deadlines: [
        {
          id: uid('d'),
          caseId: c.id,
          title: 'تقديم المستندات المطلوبة في المحضر',
          dueAt: new Date(base + 10 * DAY_MS).toISOString(),
          kind: 'document',
          source: 'extracted',
          confirmed: false,
        },
      ],
    };
  }
  return { kind: doc.kind, summary: 'حُفظ المستند في ملف القضية، وسأستعمله في التقييم والمذكرات.', keyPoints: [], requests: [], deadlines: [] };
}

/** تدريب الجلسة: AI يؤدي دور القاضي، ويعلّق على كل إجابة ثم يسأل التالي. */
const JUDGE_QUESTIONS = [
  'المدعي: اذكر دعواك باختصار، وما الذي تطلبه من المحكمة تحديداً؟',
  'المدعى عليه يقول إنه صرف المستحقات نقداً. ما ردك؟',
  'هل لديك ما يثبت تاريخ إنهاء العلاقة وسببه؟',
  'هل لديك أقوال أخيرة قبل أن ننظر في الطلبات؟',
];

function practiceTurn(index: number, message: string, c?: Case): { content: string; citations: Citation[] } {
  const start = message.trim() === 'ابدأ التدريب';
  if (start) {
    return {
      content: `سأكون القاضي في جلسة "${c?.title ?? 'قضيتك'}". أجب كما ستجيب في الجلسة، باختصار ووضوح، وسأعلّق على كل إجابة.\n\nالقاضي: ${JUDGE_QUESTIONS[0]}`,
      citations: [],
    };
  }
  const q = index; // عدد إجابات المستخدم السابقة = رقم السؤال الحالي (بعد رسالة البدء)
  const short = message.trim().length < 40;
  const feedback = short
    ? 'ملاحظة: إجابتك مختصرة جداً. اذكر الواقعة والتاريخ والمستند الذي يثبتها.'
    : 'ملاحظة: إجابة جيدة. اختصرها في جملتين أمام القاضي، وأشر إلى رقم المستند في ملفك.';
  const next = JUDGE_QUESTIONS[q];
  return {
    content: next
      ? `${feedback}\n\nالقاضي: ${next}`
      : `${feedback}\n\nانتهى التدريب. أنت جاهز. راجع قائمة التجهيز، واحمل نسخة من مستنداتك مرتبة بالأرقام.`,
    citations: [],
  };
}

export const mockApi: Api = {
  auth: {
    async requestOtp({ phone }) {
      await delay(600);
      if (!/^05\d{8}$/.test(phone)) throw new ApiError('رقم الجوال غير صحيح', 422);
      return { requestId: uid('otp'), expiresInSeconds: 60 };
    },
    async verifyOtp({ phone, code }) {
      await delay(600);
      if (code !== MOCK_OTP) throw new ApiError('رمز التحقق غير صحيح', 422);
      return { token: uid('token'), user: { id: 'u-1', name: 'أحمد', phone, plan: 'free' } };
    },
    async me() {
      await delay();
      return { id: 'u-1', name: 'أحمد', phone: '0500000000', plan: 'free' };
    },
    async logout() {
      await delay(150);
    },
  },

  cases: {
    async list() {
      await delay();
      return clone(db.cases.map(toSummary)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async get(id) {
      await delay();
      return clone(findCase(id));
    },
    async create(input) {
      await delay(700);
      const now = new Date().toISOString();
      const c: Case = {
        id: uid('case'),
        ...input,
        stage: 'assessment',
        updatedAt: now,
        progress: 0.05,
        parties: [
          { name: 'أنت', role: input.userRole },
          { name: input.opponentName, role: input.userRole === 'plaintiff' ? 'defendant' : 'plaintiff' },
        ],
        hearings: [],
        minutes: [],
        memos: [],
        timeline: [
          { id: uid('t'), at: now, kind: 'created', title: 'أنشأت القضية في محاميك' },
          { id: uid('t'), at: now, kind: 'note', title: 'جهّز AI تقييماً أولياً لموقفك' },
        ],
        assessment: {
          score: 60,
          headline: 'تقييم أولي، ويتضح أكثر مع المستندات',
          strengths: ['وقائعك واضحة ومرتبة'],
          needsEvidence: ['المستندات التي تثبت ما ذكرته (عقد، مراسلات، إيصالات)'],
          claims: input.claimAmount ? [{ label: 'المبلغ المطالب به', amount: input.claimAmount }] : [],
          citations: [],
          beforeYouStart: 'ارفع ما لديك من مستندات، وسأعيد التقييم بدقة أعلى.',
          recommendLawyer: input.type === 'criminal' || input.type === 'administrative',
          generatedAt: now,
        },
        nextSteps: [
          { id: uid('s'), title: 'ارفع المستندات الأساسية', detail: 'العقود والمراسلات وأي إثباتات لديك.', action: 'upload_document', done: false },
          { id: uid('s'), title: 'دع AI يصوغ صحيفة الدعوى', detail: 'مبنية على وقائعك والأنظمة ذات الصلة.', action: 'draft_memo', done: false },
          { id: uid('s'), title: 'قيّد الدعوى في ناجز', detail: 'سنرشدك خطوة بخطوة.', action: 'file_najiz', done: false },
        ],
      };
      db.cases.unshift(c);
      return clone(c);
    },
    async toggleNextStep(caseId, stepId) {
      await delay(150);
      const c = findCase(caseId);
      const s = c.nextSteps.find((x) => x.id === stepId);
      if (s) s.done = !s.done;
      return clone(c);
    },
    async toggleHearingPrep(caseId, hearingId, itemId) {
      await delay(120);
      const h = findCase(caseId).hearings.find((x) => x.id === hearingId);
      if (!h) throw new ApiError('الجلسة غير موجودة', 404);
      const item = h.preparation.find((x) => x.id === itemId);
      if (item) item.done = !item.done;
      return clone(h);
    },
    async upcomingHearings() {
      await delay();
      const now = Date.now();
      return clone(
        db.cases
          .flatMap((c) => c.hearings.map((h) => ({ ...h, caseTitle: c.title })))
          .filter((h) => h.status === 'scheduled' && new Date(h.scheduledAt).getTime() >= now - 3600000)
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
      );
    },
    async awaitingOutcome() {
      await delay();
      const cutoff = Date.now() - 3600000;
      return clone(
        db.cases
          .flatMap((c) => c.hearings.map((h) => ({ ...h, caseTitle: c.title })))
          .filter((h) => h.status === 'scheduled' && new Date(h.scheduledAt).getTime() < cutoff)
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
      );
    },
    async recordHearingOutcome(caseId, hearingId, input) {
      await delay(500);
      return clone(applyHearingOutcome(findCase(caseId), hearingId, input));
    },
    async deadlines() {
      await delay();
      const all = db.cases.flatMap((c) => allDeadlines(c));
      const now = Date.now() - 86400000;
      return clone(all.filter((d) => new Date(d.dueAt).getTime() >= now).sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
    },
    async confirmDeadline(caseId, deadlineId) {
      await delay(200);
      const c = findCase(caseId);
      const d = allDeadlines(c).find((x) => x.id === deadlineId);
      if (!d) throw new ApiError('المهلة غير موجودة', 404);
      d.confirmed = true;
      if (c.nextDeadline?.id === deadlineId) c.nextDeadline.confirmed = true;
      return clone(d);
    },
  },

  memos: {
    async get(caseId, memoId) {
      await delay();
      const memo = findCase(caseId).memos.find((m) => m.id === memoId);
      if (!memo) throw new ApiError('المذكرة غير موجودة', 404);
      return clone(memo);
    },
    async draft({ caseId, kind, instructions }) {
      await delay(1400);
      const c = findCase(caseId);
      const memo: Memo = {
        id: uid('memo'),
        caseId,
        kind,
        title: `${memoKindLabels[kind]} (مسودة)`,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        generatedByAI: true,
        citations: [],
        body: `مسودة تجريبية لقضية "${c.title}".\n${instructions ? `\nتعليماتك: ${instructions}\n` : ''}\nسيصوغ محرك الرائد هنا مذكرة كاملة مبنية على وقائع القضية ومحاضرها والأنظمة والسوابق ذات الصلة.`,
      };
      c.memos.unshift(memo);
      return clone(memo);
    },
  },

  assistant: {
    async history(conversationId) {
      await delay(150);
      return clone(conversationId ? (db.conversations.get(conversationId) ?? []) : []);
    },
    async ask({ caseId, conversationId, message, mode }) {
      await delay(1100);
      const id = conversationId ?? uid('conv');
      const c = caseId ? db.cases.find((x) => x.id === caseId) : undefined;
      const turnIndex = (db.conversations.get(id) ?? []).filter((m) => m.role === 'user').length;
      const answer = mode === 'practice' ? practiceTurn(turnIndex, message, c) : mockAnswer(message, c);
      const list = db.conversations.get(id) ?? [];
      const now = new Date().toISOString();
      list.push({ id: uid('msg'), role: 'user', content: message, createdAt: now });
      const reply: ChatMessage = { id: uid('msg'), role: 'assistant', createdAt: now, ...answer };
      list.push(reply);
      db.conversations.set(id, list);
      return { conversationId: id, message: clone(reply) };
    },
  },

  documents: {
    async upload({ caseId, kind, name, mimeType, size }) {
      await delay(900);
      const c = findCase(caseId);
      const doc: CaseDocument = { id: uid('doc'), caseId, kind, name, mimeType, size, createdAt: new Date().toISOString() };
      c.documents = [doc, ...(c.documents ?? [])];
      return clone(doc);
    },
    async extract(documentId) {
      await delay(1600);
      const c = db.cases.find((x) => x.documents?.some((d) => d.id === documentId));
      const doc = c?.documents?.find((d) => d.id === documentId);
      if (!c || !doc) throw new ApiError('المستند غير موجود', 404);
      doc.extraction = mockExtraction(c, doc);
      const now = new Date().toISOString();
      c.deadlines = [...(c.deadlines ?? []), ...doc.extraction.deadlines];
      const soonest = allDeadlines(c).sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
      if (soonest) c.nextDeadline = soonest;
      if (doc.kind === 'minute') {
        const hearing = c.hearings.filter((h) => h.status !== 'cancelled').sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
        c.minutes.push({
          id: uid('m'),
          caseId: c.id,
          hearingId: hearing?.id ?? '',
          date: now,
          summary: doc.extraction.summary,
          keyPoints: doc.extraction.keyPoints,
          requestsFromCourt: doc.extraction.requests,
        });
      }
      c.timeline.push({ id: uid('t'), at: now, kind: doc.kind === 'judgment' ? 'judgment' : 'minute', title: `قرأ AI ${doc.name}` });
      c.updatedAt = now;
      return clone(doc);
    },
  },

  intake: {
    async next({ sessionId, answer }) {
      await delay(answer ? 900 : 200);
      return intakeNext(sessionId, answer);
    },
  },

  account: {
    async exportData() {
      await delay(700);
      return { exportedAt: new Date().toISOString(), cases: clone(db.cases), notifications: clone(db.notifications) };
    },
    async deleteAccount() {
      await delay(700);
    },
  },

  referrals: {
    async request(caseId, note) {
      await delay(800);
      const c = findCase(caseId);
      const now = new Date().toISOString();
      c.timeline.push({ id: uid('t'), at: now, kind: 'note', title: 'طلبت عرض القضية على محامٍ من الرائد' });
      return { id: uid('ref'), caseId, status: 'requested', createdAt: now, note };
    },
  },

  notifications: {
    async list() {
      await delay();
      return clone(db.notifications);
    },
    async markRead(id) {
      await delay(100);
      const n = db.notifications.find((x) => x.id === id);
      if (n) n.read = true;
    },
  },
};
