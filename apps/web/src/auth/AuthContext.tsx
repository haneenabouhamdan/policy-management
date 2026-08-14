import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import {
  AUTH_EXPIRED_EVENT,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "../api/client";
import type { AuthUser, UserRole } from "../types/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (tenantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  canWritePolicies: boolean;
  canManageTypes: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(() =>
    getStoredUser<AuthUser>(),
  );

  const login = useCallback(
    async (tenantSlug: string, email: string, password: string) => {
      const result = await authApi.login(tenantSlug, email, password);
      setToken(result.accessToken);
      setStoredUser(result.user);
      setTokenState(result.accessToken);
      setUser(result.user);
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      canWritePolicies: hasRole("ADMIN", "UNDERWRITER"),
      canManageTypes: hasRole("ADMIN"),
      hasRole,
    }),
    [user, token, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
