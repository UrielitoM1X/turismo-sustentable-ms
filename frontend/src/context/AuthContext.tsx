import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  clearUserSession,
  decodeJwtPayload,
  getUserSession,
  UserSession,
} from "../api/httpClient";

interface AuthContextValue {
  session: UserSession;
  normalizedRole: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProvider: boolean;
  isTourist: boolean;
  canReserve: boolean;
  currentUserId: number | null;
  authNotice: string;
  setAuthNotice: (message: string) => void;
  refreshSession: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractUserId(session: UserSession): number | null {
  if (session.userId !== null) return session.userId;
  const payload = decodeJwtPayload(session.token);
  const sub =
    payload?.sub !== undefined && payload?.sub !== null ? Number(payload.sub) : null;
  return sub !== null && Number.isFinite(sub) ? sub : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(() => getUserSession());
  const [authNotice, setAuthNotice] = useState("");

  const refreshSession = useCallback(() => {
    setSession(getUserSession());
  }, []);

  const logout = useCallback(() => {
    clearUserSession();
    setAuthNotice("");
    setSession(getUserSession());
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const normalizedRole = session.role?.toUpperCase().trim() || "";
    const isAuthenticated = Boolean(session.token);
    const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "ADMINISTRADOR";
    const isProvider = normalizedRole === "PROVIDER" || normalizedRole === "PROVEEDOR";
    const isTourist = normalizedRole === "TOURIST" || normalizedRole === "TURISTA";
    const canReserve = !isAuthenticated || isTourist;
    const currentUserId = extractUserId(session);

    return {
      session,
      normalizedRole,
      isAuthenticated,
      isAdmin,
      isProvider,
      isTourist,
      canReserve,
      currentUserId,
      authNotice,
      setAuthNotice,
      refreshSession,
      logout,
    };
  }, [session, authNotice, refreshSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
