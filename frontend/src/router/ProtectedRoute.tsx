import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "./routes";

type AllowedRole = "ADMIN" | "PROVIDER" | "TOURIST";

interface ProtectedRouteProps {
  allowedRoles: AllowedRole[];
  children: React.ReactElement;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isProvider, isTourist } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  const hasAccess =
    (isAdmin && allowedRoles.includes("ADMIN")) ||
    (isProvider && allowedRoles.includes("PROVIDER")) ||
    (isTourist && allowedRoles.includes("TOURIST"));

  if (!hasAccess) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}
