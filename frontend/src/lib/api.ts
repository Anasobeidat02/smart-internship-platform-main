import type { TokenPair } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("refresh_token");
}

export function setTokens(t: TokenPair) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("access_token", t.access_token);
  window.localStorage.setItem("refresh_token", t.refresh_token);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
}

export async function logoutApi(): Promise<void> {
  if (typeof window === "undefined") return;
  const refresh = window.localStorage.getItem("refresh_token");
  if (refresh) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch {
      // best-effort: ignore network errors during logout
    }
  }
  clearTokens();
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const data: TokenPair = await res.json();
    setTokens(data);
    return data.access_token;
  } catch {
    return null;
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, auth = true, query, headers, ...rest } = opts;

  let url = `${API_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  // دالة داخلية لتنفيذ الطلب بالتوكن الممرر لها
  const exec = async (currentToken: string | null): Promise<Response> => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string> | undefined),
    };
    if (auth && currentToken) {
      h.Authorization = `Bearer ${currentToken}`;
    }
    return fetch(url, {
      ...rest,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  // 1. جلب التوكن الحالي وتشغيل الطلب
  let token = auth ? getAccessToken() : null;
  let res = await exec(token);

  // 2. إذا انتهت صلاحية التوكن (401)، نقوم بتحديثه تلقائياً وإعادة المحاولة
  if (res.status === 401 && auth) {
    token = await refreshAccessToken();
    if (token) {
      res = await exec(token);
    }
    if (!res.ok) {
      clearTokens();
    }
  }

  // 3. معالجة الأخطاء القادمة من السيرفر
  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    const message =
      (detail && typeof detail === "object" && "detail" in detail && typeof (detail as { detail: unknown }).detail === "string"
        ? ((detail as { detail: string }).detail)
        : res.statusText) || "Request failed";
    throw new ApiError(res.status, detail, message);
  }

  // 4. إرجاع النتيجة بنجاح
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}