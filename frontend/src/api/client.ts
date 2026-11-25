const TOKEN_KEY = "ts_access_token";
const ROLE_KEY = "ts_user_role";
const NAME_KEY = "ts_user_name";

export interface UserSession {
  token: string | null;
  role: string | null;
  name: string | null;
  userId: number | null;
}

export function decodeJwtPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonStr = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserSession(): UserSession {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return { token: null, role: null, name: null, userId: null };
  }
  const payload = decodeJwtPayload(token);
  if (!payload || (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now())) {
    clearUserSession();
    return { token: null, role: null, name: null, userId: null };
  }
  const role = typeof payload.role === "string" ? payload.role : localStorage.getItem(ROLE_KEY);
  const rawSub = payload.sub !== undefined && payload.sub !== null ? Number(payload.sub) : null;
  const userId = rawSub !== null && Number.isFinite(rawSub) ? rawSub : null;
  return {
    token,
    role,
    name: localStorage.getItem(NAME_KEY),
    userId,
  };
}

export function saveUserSession(token: string, role: string, name?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  if (name) localStorage.setItem(NAME_KEY, name);
}

export function clearUserSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearUserSession();
    }
    const msg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || "Error de validación"
      : data.detail || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}