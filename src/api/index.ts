import { useMockApi } from './config';
import type { Api } from './services/contracts';
import { httpApi } from './services/http';
import { mockApi } from './mock/mock-api';

/** نقطة الدخول الوحيدة للبيانات في التطبيق. */
export const api: Api = useMockApi ? mockApi : httpApi;
export { useMockApi };
export * from './types';
