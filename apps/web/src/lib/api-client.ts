import type { AuthResponse } from '@app/shared';
import { getAccessToken, useAuthStore } from './auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  // Skip the Authorization header + refresh dance (used by login/signup/refresh itself).
  skipAuth?: boolean;
  // Internal flag to prevent infinite refresh loops.
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

// Exported so callers outside the request()/401 retry flow (namely the
// AuthBootstrap effect in providers.tsx) go through the same de-duplicated
// singleton instead of firing their own independent call. The refresh token
// is single-use and rotates on every call, so two concurrent calls (e.g.
// React StrictMode double-invoking an effect in dev) would otherwise race:
// the first rotates the token and succeeds, the second reuses the
// now-stale token and gets rejected, incorrectly clearing a valid session.
export async function refreshAccessToken(): Promise<string | null> {
  // De-duplicate concurrent 401s into a single refresh call.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as AuthResponse;
        useAuthStore.getState().setSession(data);
        return data.accessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, _retried, headers, ...rest } = options;
  const token = skipAuth ? null : getAccessToken();

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuth && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...options, _retried: true });
    }
    useAuthStore.getState().clearSession();
    if (typeof window !== 'undefined') {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }
    throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const errPayload = payload as { code?: string; message?: string; details?: unknown } | null;
    throw new ApiError(
      res.status,
      errPayload?.code ?? 'UNKNOWN_ERROR',
      errPayload?.message ?? 'Something went wrong. Please try again.',
      errPayload?.details,
    );
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const errPayload = payload as { code?: string; message?: string } | null;
      throw new ApiError(res.status, errPayload?.code ?? 'UPLOAD_FAILED', errPayload?.message ?? 'Upload failed.');
    }
    return payload as T;
  },
};

export { API_URL };
