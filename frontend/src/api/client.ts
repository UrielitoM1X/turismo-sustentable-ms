const TOKEN_KEY = "ts_access_token";
const ROLE_KEY = "ts_user_role";
const NAME_KEY = "ts_user_name";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserSession() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    role: localStorage.getItem(ROLE_KEY),
    name: localStorage.getItem(NAME_KEY),
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
    const msg = Array.isArray(data.detail)
      ? data.detail[0]?.msg || "Error de validación"
      : data.detail || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}