import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, RegisterPayload } from "../../../api/services/authService";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";

export function useAuthForm() {
  const { lang, t } = useLanguage();
  const { authNotice, setAuthNotice, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TOURIST" | "PROVIDER">("TOURIST");
  const [businessName, setBusinessName] = useState("");
  const [rfc, setRfc] = useState("");
  const [error, setError] = useState(authNotice);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authNotice) {
      setError(authNotice);
    }
  }, [authNotice]);

  const toggleMode = () => {
    setError("");
    setSuccess("");
    setAuthNotice("");
    setMode((prev) => (prev === "login" ? "register" : "login"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    setAuthNotice("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (password.length < 8 || password.length > 72) {
          throw new Error(t("auth.passwordLengthError"));
        }

        const payload: RegisterPayload = {
          email: email.trim(),
          password,
          full_name: name.trim(),
          role,
          preferred_language: lang,
        };

        if (role === "PROVIDER") {
          payload.business_name = businessName.trim() || `${name.trim()} Ecoturismo`;
          payload.rfc = rfc.trim().toUpperCase();
        }

        await authService.register(payload);
        setSuccess(t("auth.registerSuccess"));
        setTimeout(() => {
          refreshSession();
          navigate(ROUTES.HOME, { replace: true });
        }, 500);
        return;
      }

      await authService.login(email.trim(), password);
      refreshSession();
      navigate(ROUTES.HOME, { replace: true });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return {
    mode,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    businessName,
    setBusinessName,
    rfc,
    setRfc,
    error,
    success,
    loading,
    toggleMode,
    handleSubmit,
  };
}
