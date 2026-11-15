/**
 * إعدادات الاتصال بالخلفية.
 * - بدون EXPO_PUBLIC_API_URL يعمل التطبيق ببيانات تجريبية محلية.
 * - مع ضبطه (مثلاً عنوان خلفية الرائد) تذهب كل الطلبات للخلفية الحقيقية.
 */
export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '',
  // ردود المحامي الذكي وصياغة المذكرات تأخذ دقيقة أحيانا
  timeoutMs: 150000,
};

export const useMockApi = apiConfig.baseUrl.length === 0;
