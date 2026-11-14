import { apiConfig } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

/** غلاف fetch موحّد: يضيف الرمز، يتعامل مع المهلة والأخطاء. */
export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(apiConfig.baseUrl + path);
  for (const [k, v] of Object.entries(options.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  options.signal?.addEventListener('abort', () => controller.abort());

  try {
    const res = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'ar',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeJson(text) : undefined;

    if (res.status === 401) onUnauthorized?.();
    if (!res.ok) {
      const serverMessage =
        data && typeof data === 'object' && 'message' in data ? String((data as { message: unknown }).message) : '';
      const message = serverMessage || 'تعذر إكمال الطلب، حاول مرة أخرى';
      throw new ApiError(message, res.status, data);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('تعذر الاتصال بالخادم، تحقق من الإنترنت', 0);
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
