import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch, saveUserSession } from "../api/client";

interface AuthViewsProps {
  initialError?: string;
  onSuccess: () => void;
}

export default function AuthViews({ initialError = "", onSuccess }: AuthViewsProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TOURIST" | "PROVIDER" | "ADMIN">("TOURIST");
  const [businessName, setBusinessName] = useState("");
  const [rfc, setRfc] = useState("");
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        const payload: any = {
          email,
          password,
          full_name: name,
          role,
          preferred_language: "es",
        };
        if (role === "PROVIDER") {
          payload.business_name = businessName || `${name} Ecoturismo`;
          payload.rfc = rfc || "XAXX010101000";
        }
        const res = await apiFetch<any>("/api/auth/users/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        saveUserSession(res.access_token, res.role, name || email);
        setSuccess("Cuenta creada correctamente. Redirigiendo...");
        setTimeout(onSuccess, 500);
      } else {
        const res = await apiFetch<any>("/api/auth/users/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        saveUserSession(res.access_token, res.role, email);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
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
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-[#63665E] dark:text-[#9EA399] mb-8">
              Inicia sesión para planear tu próxima escapada.
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
              Crear Cuenta
            </h2>
            <p className="text-sm text-[#63665E] dark:text-[#9EA399] mb-8">
              Únete a nuestra comunidad sustentable.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                  Nombre Completo
                </label>
                <input
                  required
                  disabled={loading}
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white placeholder-[#8C9287] rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                  Tipo de Perfil
                </label>
                <select
                  disabled={loading}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
                >
                  <option value="TOURIST">Turista</option>
                  <option value="PROVIDER">Proveedor / Cooperativa</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {role === "PROVIDER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                      Nombre del Negocio
                    </label>
                    <input
                      required
                      placeholder="Chinampas Vivas SC"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-sm rounded-xl px-4 h-12"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                      RFC
                    </label>
                    <input
                      required
                      placeholder="CVI260101ABC"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value)}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-sm rounded-xl px-4 h-12"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
              Correo / Usuario
            </label>
            <input
              required
              disabled={loading}
              type="email"
              placeholder="usuario@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white placeholder-[#8C9287] rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
                Teléfono
              </label>
              <input
                disabled={loading}
                type="tel"
                placeholder="Ej. 55 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-white placeholder-[#8C9287] rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#C81D77]/50"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#232621] dark:text-[#D1D5CD]">
              Contraseña
            </label>
            <input
              required
              disabled={loading}
              type="password"
              minLength={6}
              placeholder="••••••••"
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
              ? "Procesando..."
              : mode === "login"
              ? "Iniciar Sesión"
              : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-6">
          <div className="flex justify-between items-center text-sm text-[#63665E] dark:text-[#9EA399]">
            <span>{mode === "login" ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}</span>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setMode(mode === "login" ? "register" : "login");
              }}
              className="text-[#C81D77] dark:text-[#E24A96] font-medium hover:underline"
            >
              {mode === "login" ? "Crear perfil" : "Iniciar sesión"}
            </button>
          </div>

          <p className="text-center text-xs text-[#63665E] dark:text-[#9EA399]">
            Al continuar, aceptas nuestros Términos y privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}