import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { api, getApiErrorMessage, type ApiError, type AuthResponse } from "@/lib/api";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthResponse["user"] | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  handleUnauthorized: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "ledger_session";
const TOKEN_KEY = "ledger_token";
const USER_KEY = "ledger_user";

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(SESSION_KEY) === "1");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthResponse["user"] | null>(loadUser);

  const persistSession = (response: AuthResponse) => {
    const nextToken = response.token || null;
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    }
    if (response.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
    }
    localStorage.setItem(SESSION_KEY, "1");
    setIsAuthenticated(true);
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    isLoading,
    user,
    token,
    async login(email, password) {
      setIsLoading(true);
      try {
        const response = await api.auth.login({ email, password });
        persistSession(response);
      } catch (error) {
        const next = error as ApiError;
        next.message = getApiErrorMessage(error);
        throw next;
      } finally {
        setIsLoading(false);
      }
    },
    async register(name, email, password) {
      setIsLoading(true);
      try {
        const response = await api.auth.register({ name, email, password });
        persistSession(response);
      } catch (error) {
        const next = error as ApiError;
        next.message = getApiErrorMessage(error);
        throw next;
      } finally {
        setIsLoading(false);
      }
    },
    async logout() {
      try {
        await api.auth.logout(token);
      } finally {
        clearSession();
      }
    },
    handleUnauthorized: clearSession,
  }), [isAuthenticated, isLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
