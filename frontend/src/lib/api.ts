const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("talentos_token");
}

export function setSession(token: string, role: string, name: string, email: string) {
  localStorage.setItem("talentos_token", token);
  localStorage.setItem("talentos_role", role);
  localStorage.setItem("talentos_name", name);
  localStorage.setItem("talentos_email", email);
}

export function clearSession() {
  localStorage.removeItem("talentos_token");
  localStorage.removeItem("talentos_role");
  localStorage.removeItem("talentos_name");
  localStorage.removeItem("talentos_email");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || JSON.stringify(body);
      if (Array.isArray(body.detail)) {
        detail = body.detail.map((item: { msg?: string }) => item.msg).join(", ");
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(response.status, String(detail));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
