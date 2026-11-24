import React, { useEffect, useState } from "react";
import {
  Leaf,
  MapPin,
  Users,
  Clock,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Ticket,
  LogOut,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  apiFetch,
  getUserSession,
  saveUserSession,
  clearUserSession,
} from "./api/client";

type Tab = "explorar" | "reservas" | "ia" | "bi" | "proveedor" | "auth";

interface Experience {
  id: number;
  provider_id: number;
  title: string;
  category: string;
  borough_cdmx: string;
  price: number;
  duration_minutes: number;
  max_capacity: number;
  sustainable_practices?: string;
  pet_friendly?: boolean;
  accessible?: boolean;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("explorar");
  const [session, setSession] = useState(getUserSession());

  // Catalogo
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [boroughFilter, setBoroughFilter] = useState("");
  const [loadingExp, setLoadingExp] = useState(true);

  // Checkout Modal
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [guests, setGuests] = useState(2);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Mis Reservas
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Auth Form
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<"TOURIST" | "PROVIDER">("TOURIST");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Crear Experiencia (Proveedor)
  const [newExp, setNewExp] = useState({
    title: "",
    category: "Naturaleza",
    borough_cdmx: "Xochimilco",
    price: 650,
    duration_minutes: 180,
    max_capacity: 8,
    sustainable_practices: "Cero plásticos de un solo uso y conservación de chinampas.",
  });
  const [provMsg, setProvMsg] = useState("");

  // IA y BI
  const [aiMessage, setAiMessage] = useState(
    "Busco algo de naturaleza y accesible para ir con mi perro"
  );
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [biMetrics, setBiMetrics] = useState<any>(null);

  const loadExperiences = async () => {
    setLoadingExp(true);
    try {
      const data = await apiFetch<Experience[]>("/api/catalog/experiences/");
      setExperiences(data);
    } catch {
      setExperiences([]);
    } finally {
      setLoadingExp(false);
    }
  };

  const loadMyBookings = async () => {
    if (!getUserSession().token) return;
    try {
      const data = await apiFetch<any[]>("/api/bookings/reservations/my-bookings");
      setMyBookings(data);
    } catch {
      setMyBookings([]);
    }
  };

  const [biError, setBiError] = useState("");

  const loadBiMetrics = async () => {
    setBiError("");
    try {
      const data = await apiFetch<any>("/api/bi/dashboard/summary");
      setBiMetrics(data);
    } catch (err: any) {
      setBiMetrics(null);
      setBiError(err.message);
    }
  };

  useEffect(() => {
    loadExperiences();
  }, []);

  useEffect(() => {
    if (tab === "reservas") loadMyBookings();
    if (tab === "bi") loadBiMetrics();
  }, [tab]);

  // Manejar inicio de sesion o registro
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (isRegister) {
        const res = await apiFetch<any>("/api/auth/users/register", {
          method: "POST",
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            full_name: authName || "Turista CDMX",
            role: authRole,
            preferred_language: "es",
          }),
        });
        saveUserSession(res.access_token, res.role, authName || authEmail);
        setSession(getUserSession());
        setTab("explorar");
      } else {
        const data = await apiFetch<any>("/api/auth/users/login", {
          method: "POST",
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
          }),
        });
        saveUserSession(data.access_token, data.role, authEmail);
        setSession(getUserSession());
        setTab("explorar");
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Abrir checkout exigiendo login
  const handleOpenBooking = (exp: Experience) => {
    if (!session.token) {
      setAuthError("Inicia sesión o crea una cuenta para poder reservar experiencias.");
      setTab("auth");
      return;
    }
    setBookingMsg(null);
    setSelectedExp(exp);
  };

  // Confirmar reserva y pago en booking-service
  const handleConfirmBooking = async () => {
    if (!selectedExp) return;
    setBookingLoading(true);
    setBookingMsg(null);
    try {
      const pre = await apiFetch<any>("/api/bookings/reservations/reserve", {
        method: "POST",
        body: JSON.stringify({
          experience_id: selectedExp.id,
          activity_date: bookingDate,
          guests_count: guests,
          unit_price: selectedExp.price,
          max_ecological_capacity: selectedExp.max_capacity,
        }),
      });

      const paid = await apiFetch<any>("/api/bookings/reservations/pay", {
        method: "POST",
        body: JSON.stringify({
          booking_id: pre.booking_id,
          payment_method: "CARD",
          simulate_failure: false,
        }),
      });

      setBookingMsg({
        type: "ok",
        text: `¡Reserva confirmada! Código de acceso ecológico: ${paid.access_code}`,
      });
      loadMyBookings();
    } catch (err: any) {
      setBookingMsg({ type: "err", text: err.message });
    } finally {
      setBookingLoading(false);
    }
  };

  // Crear experiencia (Proveedor)
  const handleCreateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvMsg("");
    try {
      await apiFetch("/api/catalog/experiences/", {
        method: "POST",
        body: JSON.stringify({
          ...newExp,
          price: Number(newExp.price),
          duration_minutes: Number(newExp.duration_minutes),
          max_capacity: Number(newExp.max_capacity),
          pet_friendly: true,
          accessible: true,
        }),
      });
      setProvMsg("¡Experiencia publicada en el catálogo!");
      setNewExp({ ...newExp, title: "" });
      loadExperiences();
    } catch (err: any) {
      setProvMsg(`Error: ${err.message}`);
    }
  };

  // Consultar Recomendador IA
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const data = await apiFetch("/api/ai/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: aiMessage }),
      });
      setAiResult(data);
    } catch (err: any) {
      setAiResult({ error: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const filteredExperiences = experiences.filter((e) =>
    boroughFilter ? e.borough_cdmx.toLowerCase().includes(boroughFilter.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F2EFE9] text-[#1E201D]">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-[#F2EFE9]/90 backdrop-blur border-b border-[#E3E5D8]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setTab("explorar")}
            className="flex items-center gap-2 font-serif text-xl font-bold text-[#3B523E]"
          >
            <span className="w-9 h-9 rounded-full bg-[#728C69] text-white flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </span>
            EcoCDMX
          </button>

          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <button
              onClick={() => setTab("explorar")}
              className={`px-3 py-1.5 rounded-xl transition ${
                tab === "explorar" ? "bg-[#728C69] text-white" : "hover:bg-[#E3E5D8]"
              }`}
            >
              Explorar
            </button>
            <button
              onClick={() => setTab("reservas")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                tab === "reservas" ? "bg-[#728C69] text-white" : "hover:bg-[#E3E5D8]"
              }`}
            >
              <Ticket className="w-4 h-4" /> Mis Reservas
            </button>
            <button
              onClick={() => setTab("ia")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                tab === "ia" ? "bg-[#728C69] text-white" : "hover:bg-[#E3E5D8]"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Guía IA
            </button>
            <button
              onClick={() => setTab("bi")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                tab === "bi" ? "bg-[#728C69] text-white" : "hover:bg-[#E3E5D8]"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Impacto BI
            </button>
            {session.role === "PROVIDER" && (
              <button
                onClick={() => setTab("proveedor")}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
                  tab === "proveedor" ? "bg-[#3B523E] text-white" : "hover:bg-[#E3E5D8]"
                }`}
              >
                <PlusCircle className="w-4 h-4" /> Publicar
              </button>
            )}
          </nav>

          <div>
            {session.token ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs font-medium text-[#3B523E] bg-[#E3E5D8] px-3 py-1.5 rounded-full">
                  {session.name} ({session.role})
                </span>
                <button
                  onClick={() => {
                    clearUserSession();
                    setSession(getUserSession());
                    setTab("explorar");
                  }}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl hover:bg-red-100 text-red-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError("");
                  setTab("auth");
                }}
                className="bg-[#C81D77] hover:bg-[#A91864] text-white text-sm font-medium px-4 py-2 rounded-xl transition"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* TAB 1: EXPLORAR CATALOGO */}
        {tab === "explorar" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#728C69] font-semibold">
                  Turismo Regenerativo · Ciudad de México
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201D] mt-1">
                  Experiencias con bajo impacto ecológico
                </h1>
              </div>
              <input
                type="text"
                placeholder="Filtrar por alcaldía (ej. Xochimilco)..."
                value={boroughFilter}
                onChange={(e) => setBoroughFilter(e.target.value)}
                className="bg-white border border-[#E3E5D8] rounded-xl px-4 py-2.5 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#728C69]"
              />
            </div>

            {loadingExp ? (
              <p className="text-sm text-[#63665E]">Cargando catálogo sustentable...</p>
            ) : filteredExperiences.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E3E5D8]">
                <p className="text-[#63665E] mb-3">Aún no hay experiencias publicadas en el catálogo.</p>
                <p className="text-xs text-[#8C9287]">
                  Regístrate con rol <strong>Proveedor</strong> para publicar la primera experiencia.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-[#E3E5D8] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="bg-[#EBE9E0] text-[#3B523E] font-medium px-3 py-1 rounded-full">
                          {exp.category}
                        </span>
                        <span className="flex items-center gap-1 text-[#728C69] font-medium">
                          <ShieldCheck className="w-4 h-4" /> Verificada
                        </span>
                      </div>
                      <h2 className="font-serif text-xl font-semibold text-[#1E201D] mb-2">
                        {exp.title}
                      </h2>
                      <p className="text-xs text-[#63665E] line-clamp-3 mb-4">
                        {exp.sustainable_practices ||
                          "Actividad ecoturística con control estricto de capacidad de carga."}
                      </p>
                      <div className="space-y-1.5 text-xs text-[#63665E] mb-6">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#728C69]" /> {exp.borough_cdmx}, CDMX
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#728C69]" /> {exp.duration_minutes} min
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#728C69]" /> Cupo ecológico máx: {exp.max_capacity} personas
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E3E5D8] flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-[#1E201D]">${exp.price}</span>
                        <span className="text-xs text-[#8C9287]"> MXN / persona</span>
                      </div>
                      <button
                        onClick={() => handleOpenBooking(exp)}
                        className="bg-[#C81D77] hover:bg-[#A91864] text-white text-xs font-medium px-4 py-2.5 rounded-xl transition"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MIS RESERVAS */}
        {tab === "reservas" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="font-serif text-3xl mb-6">Mis Reservaciones</h1>
            {!session.token ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E3E5D8]">
                <p className="text-sm text-[#63665E] mb-4">
                  Inicia sesión para consultar tus pases ecológicos y reservaciones confirmadas.
                </p>
                <button
                  onClick={() => setTab("auth")}
                  className="bg-[#C81D77] text-white text-sm px-5 py-2.5 rounded-xl"
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#E3E5D8]">
                <p className="text-sm text-[#63665E]">Aún no tienes reservaciones registradas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl p-5 border border-[#E3E5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-mono bg-[#EBE9E0] text-[#3B523E] px-2.5 py-1 rounded-md">
                        Pase: {b.access_code || `TS-${b.id}`}
                      </span>
                      <h3 className="font-serif text-lg mt-2">
                        Experiencia #{b.experience_id} · {b.activity_date}
                      </h3>
                      <p className="text-xs text-[#63665E]">
                        {b.guests_count} personas · Total pagado: ${b.total_amount} MXN
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-800 self-start sm:self-center">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AUTH (LOGIN / REGISTER) */}
        {tab === "auth" && (
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-sm border border-[#E3E5D8]">
            <h1 className="font-serif text-3xl mb-2">
              {isRegister ? "Crear Cuenta" : "Bienvenido de nuevo"}
            </h1>
            <p className="text-xs text-[#63665E] mb-6">
              {isRegister
                ? "Regístrate en el microservicio de identidad para reservar o publicar."
                : "Inicia sesión para gestionar tus reservaciones sustentables."}
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">Nombre completo</label>
                    <input
                      required
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Uriel Miranda"
                      className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tipo de cuenta</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as any)}
                      className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11 text-sm"
                    >
                      <option value="TOURIST">Turista</option>
                      <option value="PROVIDER">Proveedor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Correo electrónico</label>
                <input
                  required
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="usuario@correo.com"
                  className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Contraseña</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11 text-sm"
                />
              </div>

              <button
                disabled={authLoading}
                type="submit"
                className="w-full bg-[#C81D77] hover:bg-[#A91864] text-white font-medium rounded-xl h-11 text-sm transition"
              >
                {authLoading ? "Procesando..." : isRegister ? "Registrarme" : "Entrar"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#63665E]">
              {isRegister ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
              <button
                onClick={() => {
                  setAuthError("");
                  setIsRegister(!isRegister);
                }}
                className="text-[#C81D77] font-semibold hover:underline"
              >
                {isRegister ? "Inicia sesión" : "Crear perfil"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PROVEEDOR */}
        {tab === "proveedor" && (
          <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border border-[#E3E5D8]">
            <h1 className="font-serif text-2xl mb-4">Publicar Experiencia Sustentable</h1>
            {provMsg && <p className="text-xs text-[#3B523E] bg-[#EBE9E0] p-3 rounded-xl mb-4">{provMsg}</p>}
            <form onSubmit={handleCreateExperience} className="space-y-4 text-sm">
              <input
                required
                placeholder="Título de la experiencia"
                value={newExp.title}
                onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Alcaldía CDMX"
                  value={newExp.borough_cdmx}
                  onChange={(e) => setNewExp({ ...newExp, borough_cdmx: e.target.value })}
                  className="bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
                <input
                  placeholder="Categoría"
                  value={newExp.category}
                  onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
                  className="bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Precio MXN"
                  value={newExp.price}
                  onChange={(e) => setNewExp({ ...newExp, price: Number(e.target.value) })}
                  className="bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
                <input
                  type="number"
                  placeholder="Minutos"
                  value={newExp.duration_minutes}
                  onChange={(e) => setNewExp({ ...newExp, duration_minutes: Number(e.target.value) })}
                  className="bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
                <input
                  type="number"
                  placeholder="Cupo máx"
                  value={newExp.max_capacity}
                  onChange={(e) => setNewExp({ ...newExp, max_capacity: Number(e.target.value) })}
                  className="bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Prácticas sustentables verificables"
                value={newExp.sustainable_practices}
                onChange={(e) => setNewExp({ ...newExp, sustainable_practices: e.target.value })}
                className="w-full bg-[#F2EFE9] rounded-xl p-4"
              />
              <button
                type="submit"
                className="w-full bg-[#728C69] hover:bg-[#5B7153] text-white font-medium rounded-xl h-11"
              >
                Guardar en Catálogo
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: ASISTENTE IA */}
        {tab === "ia" && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-[#E3E5D8]">
            <h1 className="font-serif text-2xl mb-2">Asistente Ecoturístico IA</h1>
            <p className="text-xs text-[#63665E] mb-6">
              Describe qué tipo de experiencia sustentable buscas (alcaldía, accesibilidad, mascotas o presupuesto).
            </p>
            <form onSubmit={handleAskAi} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                required
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="Ej. Busco algo de naturaleza en Xochimilco..."
                className="flex-1 bg-[#F2EFE9] rounded-xl px-4 h-11 text-sm"
              />
              <button
                disabled={aiLoading}
                type="submit"
                className="bg-[#728C69] hover:bg-[#5B7153] text-white rounded-xl px-6 h-11 text-sm font-medium transition"
              >
                {aiLoading ? "Consultando..." : "Recomendar"}
              </button>
            </form>

            {aiResult?.assistant_reply && (
              <div className="bg-[#F2EFE9] border border-[#E3E5D8] p-5 rounded-2xl text-sm text-[#1E201D] leading-relaxed">
                {aiResult.assistant_reply}
              </div>
            )}
            {aiResult?.error && (
              <p className="text-xs text-red-600">{aiResult.error}</p>
            )}
          </div>
        )}

        {/* TAB 6: PANEL BI */}
        {tab === "bi" && (
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-3xl mb-2">Impacto Ambiental y Métricas BI</h1>
            <p className="text-xs text-[#63665E] mb-6">
              Indicadores actualizados en tiempo real mediante eventos de RabbitMQ.
            </p>

            {biError ? (
              <div className="bg-white rounded-3xl p-8 border border-[#E3E5D8] text-sm text-amber-800">
                Acceso restringido: {biError}. Inicia sesión con una cuenta de <strong>Administrador</strong> para ver los KPIs financieros.
              </div>
            ) : biMetrics?.kpis ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-[#E3E5D8]">
                  <span className="text-xs text-[#63665E]">Reservas Totales</span>
                  <p className="font-serif text-3xl font-bold text-[#1E201D] mt-1">
                    {biMetrics.kpis.total_bookings}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E3E5D8]">
                  <span className="text-xs text-[#63665E]">Ingresos Generados</span>
                  <p className="font-serif text-3xl font-bold text-[#3B523E] mt-1">
                    ${biMetrics.kpis.total_revenue}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E3E5D8]">
                  <span className="text-xs text-[#63665E]">Fondo Ecológico</span>
                  <p className="font-serif text-3xl font-bold text-[#728C69] mt-1">
                    ${biMetrics.kpis.total_impact_fund}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E3E5D8]">
                  <span className="text-xs text-[#63665E]">Turistas Movilizados</span>
                  <p className="font-serif text-3xl font-bold text-[#C81D77] mt-1">
                    {biMetrics.kpis.total_tourists_mobilized}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-[#E3E5D8] text-sm text-[#63665E]">
                Cargando indicadores analíticos...
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL CHECKOUT */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl">
            <h2 className="font-serif text-2xl mb-1">{selectedExp.title}</h2>
            <p className="text-xs text-[#63665E] mb-4">
              {selectedExp.borough_cdmx}, CDMX · Capacidad máx: {selectedExp.max_capacity}
            </p>

            {bookingMsg && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${
                  bookingMsg.type === "ok"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {bookingMsg.type === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {bookingMsg.text}
              </div>
            )}

            <div className="space-y-4 mb-6 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Fecha de visita</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Número de personas</label>
                <input
                  type="number"
                  min={1}
                  max={selectedExp.max_capacity}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-[#F2EFE9] rounded-xl px-4 h-11"
                />
              </div>
              <div className="pt-3 border-t border-[#E3E5D8] flex justify-between font-bold">
                <span>Total (incluye $50 aportación ecológica)</span>
                <span>${selectedExp.price * guests + 50} MXN</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedExp(null)}
                className="flex-1 bg-[#F2EFE9] text-[#1E201D] rounded-xl h-11 text-sm font-medium"
              >
                Cerrar
              </button>
              <button
                disabled={bookingLoading}
                onClick={handleConfirmBooking}
                className="flex-1 bg-[#C81D77] hover:bg-[#A91864] text-white rounded-xl h-11 text-sm font-medium"
              >
                {bookingLoading ? "Validando cupo..." : "Confirmar y Pagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}