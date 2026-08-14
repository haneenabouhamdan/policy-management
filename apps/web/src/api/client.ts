import type { ApiErrorBody } from "../types/api";

const TOKEN_KEY = "pm_access_token";
const USER_KEY = "pm_user";
export const AUTH_EXPIRED_EVENT = "pm:auth-expired";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || "Request failed";
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser<T>() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function parseResponseBody(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: "Unexpected response from server" };
  }
}

function clearSession() {
  setToken(null);
  setStoredUser(null);
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const withAuth = options.auth !== false;
  if (withAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = parseResponseBody(await response.text());

  if (!response.ok) {
    if (response.status === 401 && withAuth) {
      clearSession();
    }
    throw new ApiError(response.status, (data as ApiErrorBody) || {});
  }

  return data as T;
}
