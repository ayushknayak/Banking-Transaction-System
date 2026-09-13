const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type ApiError = Error & { status?: number; data?: unknown };

export type Account = {
  _id: string;
  user?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  balance?: number;
};

export type Transaction = {
  _id?: string;
  fromAccount?: string;
  toAccount?: string;
  amount?: number;
  status?: string;
  idempotencyKey?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  message?: string;
  token?: string;
  user?: { _id?: string; name?: string; email?: string };
};

function readMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }
  return fallback;
}

const REQUEST_TIMEOUT_MS = 30000;

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "The banking service is taking longer than expected. Please try again."
      : "Unable to connect to the banking service.";
    const next = new Error(message) as ApiError;
    next.status = 0;
    throw next;
  } finally {
    window.clearTimeout(timeout);
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(readMessage(data, `The banking service returned an error (${response.status}).`)) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export async function warmUpService() {
  try {
    await request("/api/accounts/", { method: "GET" });
  } catch {
    // A warm-up is best effort; the auth request remains the source of truth.
  }
}

export const api = {
  baseUrl: API_BASE_URL || "same-origin API proxy",
  auth: {
    register: (payload: { email: string; name: string; password: string }) =>
      request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (payload: { email: string; password: string }) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    logout: (token?: string | null) => request<{ message?: string }>("/api/auth/logout", { method: "POST" }, token),
  },
  accounts: {
    list: (token?: string | null) => request<{ accounts?: Account[] }>("/api/accounts/", {}, token),
    create: (token?: string | null) => request<{ account?: Account; message?: string }>("/api/accounts/", { method: "POST" }, token),
    balance: (accountId: string, token?: string | null) =>
      request<{ account?: Account; balance?: number }>(`/api/accounts/balance/${encodeURIComponent(accountId)}`, {}, token),
  },
  transactions: {
    create: (payload: { fromAccount: string; toAccount: string; amount: number; idempotencyKey: string }, token?: string | null) =>
      request<{ transaction?: Transaction; message?: string }>("/api/transactions/", { method: "POST", body: JSON.stringify(payload) }, token),
    history: (accountId: string, token?: string | null) =>
      request<{ transactions?: Transaction[] }>(`/api/transactions/account/${encodeURIComponent(accountId)}`, {}, token),
  },
};

export function getApiErrorMessage(error: unknown) {
  const status = (error as ApiError | undefined)?.status;
  if (status === 401 || status === 403) return "Your session has expired. Please sign in again.";
  if (status === 400 || status === 422) return (error as Error).message || "Check the information and try again.";
  if (status === 404) return "The requested banking record could not be found.";
  if (status === 409) return "This request conflicts with an existing transaction. No duplicate was created.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status && status >= 500) return "The banking service is temporarily unavailable. Please try again shortly.";
  return (error as Error)?.message || "Something went wrong. Please try again.";
}

export function getAccountLabel(account: Account) {
  return account._id ? `•••• ${account._id.slice(-4)}` : "Account";
}

export function getAccountBalance(account: Account, balance?: number) {
  return typeof balance === "number" ? balance : typeof account.balance === "number" ? account.balance : null;
}
