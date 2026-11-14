import { ApiError } from '../client';
import type { Api } from '../services/contracts';
import type { Case, CaseSummary, ChatMessage, Citation, Memo } from '../types';
import { stageLabels } from '@/features/labels';

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
        timeline: [{ id: uid('t'), at: now, kind: 'created', title: 'أنشأت القضية في محاميك' }],
        nextSteps: [
          { id: uid('s'), title: 'ارفع المستندات الأساسية', detail: 'العقود والمراسلات وأي إثباتات لديك.', action: 'upload_document', done: false },
          { id: uid('s'), title: 'دع AI يصوغ صحيفة الدعوى', detail: 'مبنية على وقائعك والأنظمة ذات الصلة.', action: 'draft_memo', done: false },
          { id: uid('s'), title: 'قيّد الدعوى في ناجز', detail: 'سنرشدك خطوة بخطوة.', done: false },
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
    async deadlines() {
      await delay();
      return clone(
        db.cases
          .map((c) => c.nextDeadline)
          .filter((d): d is NonNullable<typeof d> => !!d)
          .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
      );
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
        title: 'مسودة جديدة',
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
    async ask({ caseId, conversationId, message }) {
      await delay(1100);
      const id = conversationId ?? uid('conv');
      const c = caseId ? db.cases.find((x) => x.id === caseId) : undefined;
      const answer = mockAnswer(message, c);
      const list = db.conversations.get(id) ?? [];
      const now = new Date().toISOString();
      list.push({ id: uid('msg'), role: 'user', content: message, createdAt: now });
      const reply: ChatMessage = { id: uid('msg'), role: 'assistant', createdAt: now, ...answer };
      list.push(reply);
      db.conversations.set(id, list);
      return { conversationId: id, message: clone(reply) };
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
