const TOKEN_KEY = "ts_access_token";
const ROLE_KEY = "ts_user_role";
const NAME_KEY = "ts_user_name";
const USER_ID_KEY = "ts_user_id";

export interface UserSession {
  token: string | null;
  role: string | null;
  name: string | null;
  userId: number | null;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function decodeJwtPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
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

export function getAuthToken(): string | null {
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

  const role =
    typeof payload.role === "string" ? payload.role : localStorage.getItem(ROLE_KEY);
  const rawSub =
    payload.sub !== undefined && payload.sub !== null
      ? Number(payload.sub)
      : localStorage.getItem(USER_ID_KEY)
      ? Number(localStorage.getItem(USER_ID_KEY))
      : null;
  const userId = rawSub !== null && Number.isFinite(rawSub) ? rawSub : null;

  return {
    token,
    role,
    name: localStorage.getItem(NAME_KEY),
    userId,
  };
}

export function saveUserSession(
  token: string,
  role: string,
  name?: string,
  userId?: number
): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  if (name) localStorage.setItem(NAME_KEY, name);
  if (typeof userId === "number" && Number.isFinite(userId)) {
    localStorage.setItem(USER_ID_KEY, String(userId));
  }
}

export function clearUserSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export async function httpRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearUserSession();
    }
    if (response.status === 413) {
      throw new ApiError(
        413,
        "Los archivos superan el tamaño máximo permitido (máx. 10 MB por archivo)."
      );
    }
    const detail = Array.isArray(data.detail)
      ? data.detail[0]?.msg || "Error de validación"
      : data.detail || `Error ${response.status}`;
    throw new ApiError(response.status, detail);
  }

  return data as T;
}

export async function fetchAuthorizedBlob(endpoint: string): Promise<Blob> {
  const token = getAuthToken();
  const response = await fetch(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError(response.status, "Could not open file");
  }

  return response.blob();
}
