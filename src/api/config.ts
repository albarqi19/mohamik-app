/**
 * إعدادات الاتصال بالخلفية.
 * - بدون EXPO_PUBLIC_API_URL يعمل التطبيق ببيانات تجريبية محلية.
 * - مع ضبطه (مثلاً عنوان خلفية الرائد) تذهب كل الطلبات للخلفية الحقيقية.
 */
export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '',
  timeoutMs: 20000,
};

export const useMockApi = apiConfig.baseUrl.length === 0;
