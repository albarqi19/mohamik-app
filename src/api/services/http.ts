import { http } from '../client';
import type { Api } from './contracts';

/**
 * التطبيق الحقيقي عبر REST، مطابق لوثيقة البنية (architecture/mohamik-architecture.md، القسم 6).
 * كل المسارات تحت /api/v1. EXPO_PUBLIC_API_URL يضبط على أصل الخادم، مثل https://api.mohamik.sa
 */
const v1 = (p: string) => `/api/v1${p}`;

export const httpApi: Api = {
  auth: {
    requestOtp: (body) => http(v1('/auth/otp/request'), { method: 'POST', body }),
    verifyOtp: (body) => http(v1('/auth/otp/verify'), { method: 'POST', body }),
    me: () => http(v1('/me')),
    logout: () => http(v1('/auth/session'), { method: 'DELETE' }),
  },
  cases: {
    list: () => http(v1('/cases')),
    get: (id) => http(v1(`/cases/${id}`)),
    create: (body) => http(v1('/cases'), { method: 'POST', body }),
    toggleNextStep: (caseId, stepId) => http(v1(`/cases/${caseId}/journey/steps/${stepId}/toggle`), { method: 'POST' }),
    toggleHearingPrep: (_caseId, hearingId, itemId) =>
      http(v1(`/hearings/${hearingId}/prepare/items/${itemId}/toggle`), { method: 'POST' }),
    upcomingHearings: () => http(v1('/agenda'), { query: { type: 'hearings' } }),
    deadlines: () => http(v1('/deadlines'), { query: { range: 'upcoming' } }),
  },
  memos: {
    get: (_caseId, memoId) => http(v1(`/memos/${memoId}`)),
    draft: ({ caseId, ...body }) => http(v1(`/cases/${caseId}/memos`), { method: 'POST', body: { ...body, generate: true } }),
  },
  assistant: {
    history: (conversationId) =>
      conversationId ? http(v1(`/ai/conversations/${conversationId}/messages`)) : Promise.resolve([]),
    // ملاحظة: الخلفية ستبث الرد عبر SSE؛ هذا الشكل غير المتدفق يكفي للبداية وسيُرقّى إلى expo/fetch المتدفق.
    ask: async ({ conversationId, caseId, message }) => {
      const id =
        conversationId ??
        (await http<{ id: string }>(v1('/ai/conversations'), { method: 'POST', body: { caseId } })).id;
      return http(v1(`/ai/conversations/${id}/messages`), { method: 'POST', body: { content: message } });
    },
  },
  referrals: {
    request: (caseId, note) => http(v1(`/cases/${caseId}/referrals`), { method: 'POST', body: { note } }),
  },
  notifications: {
    list: () => http(v1('/notifications')),
    markRead: (id) => http(v1(`/notifications/${id}`), { method: 'PATCH', body: { read: true } }),
  },
};
