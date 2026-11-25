import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch, saveUserSession } from "../api/client";
import { useLanguage } from "../i18n/LanguageContext";

interface AuthViewsProps {
  initialError?: string;
  onSuccess: () => void;
}

export default function AuthViews({ initialError = "", onSuccess }: AuthViewsProps) {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TOURIST" | "PROVIDER">("TOURIST");
  const [businessName, setBusinessName] = useState("");
  const [rfc, setRfc] = useState("");
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (password.length < 8 || password.length > 72) {
          throw new Error(t("auth.passwordLengthError"));
        }
        const payload: Record<string, any> = {
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

        const res = await apiFetch<any>("/api/auth/users/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        saveUserSession(res.access_token, res.role, name.trim() || email.trim());
        setSuccess(t("auth.registerSuccess"));
        setTimeout(() => {
          onSuccess();
        }, 500);
        return;
      } else {
        const res = await apiFetch<any>("/api/auth/users/login", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        saveUserSession(res.access_token, res.role, email.trim());
        onSuccess();
        return;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-background transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#2A312C] rounded-[2rem] p-8 sm:p-10 shadow-sm border border-transparent dark:border-white/5">
        {mode === "login" ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#EBE9E0] dark:bg-[#2A352F] flex items-center justify-center mb-6">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B523E"
                className="dark:stroke-[#A5B29A]"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-[#1E201D] dark:text-white mb-2">
              {t("auth.loginTitle")}
            </h2>
            <p className="text-sm text-[#63665E] dark:text-[#9EA399] mb-8">
              {t("auth.loginSubtitle")}
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-[#EBE9E0] dark:bg-[#2A352F] flex items-center justify-center mb-6">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3B523E"
                className="dark:stroke-[#A5B29A]"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-[#1E201D] dark:text-white mb-2">
              {t("auth.registerTitle")}
            </h2>
            <p className="text-sm text-[#63665E] dark:text-[#9EA399] mb-8">
              {t("auth.registerSubtitle")}
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                  {t("auth.fullName")}
                </label>
                <input
                  required
                  disabled={loading}
                  placeholder={t("auth.fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white placeholder-[#8C9287] rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                  {t("auth.profileType")}
                </label>
                <select
                  disabled={loading}
                  value={role}
                  onChange={(e) => setRole(e.target.value as "TOURIST" | "PROVIDER")}
                  className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
                >
                  <option value="TOURIST">{t("auth.roleTourist")}</option>
                  <option value="PROVIDER">{t("auth.roleProvider")}</option>
                </select>
              </div>

              {role === "PROVIDER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                      {t("auth.businessName")}
                    </label>
                    <input
                      required
                      disabled={loading}
                      placeholder={t("auth.businessPlaceholder")}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-sm rounded-xl px-4 h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                      {t("auth.rfc")}
                    </label>
                    <input
                      required
                      disabled={loading}
                      maxLength={13}
                      placeholder="CVI260101ABC"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-sm rounded-xl px-4 h-12 uppercase"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
              {t("auth.email")}
            </label>
            <input
              required
              disabled={loading}
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white placeholder-[#8C9287] rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
              {t("auth.password")} {mode === "register" && t("auth.passwordHint")}
            </label>
            <input
              required
              disabled={loading}
              type="password"
              minLength={mode === "register" ? 8 : 6}
              maxLength={72}
              placeholder={mode === "register" ? t("auth.passwordPlaceholder") : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white placeholder-[#8C9287] rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-[#C81D77] hover:bg-[#A91864] dark:bg-[#E24A96] dark:hover:bg-[#C81D77] text-white font-medium rounded-xl h-12 mt-2 transition-colors duration-300"
          >
            {loading
              ? t("common.processing")
              : mode === "login"
              ? t("auth.submitLogin")
              : t("auth.submitRegister")}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-6">
          <div className="flex justify-between items-center text-sm text-[#63665E] dark:text-[#9EA399]">
            <span>{mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}</span>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setMode(mode === "login" ? "register" : "login");
              }}
              className="text-[#C81D77] dark:text-[#E24A96] font-medium hover:underline"
            >
              {mode === "login" ? t("auth.switchToRegister") : t("auth.switchToLogin")}
            </button>
          </div>

          <p className="text-center text-xs text-[#63665E] dark:text-[#9EA399]">
            {t("auth.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}
