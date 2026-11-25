import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  MapPin,
  Clock,
  Users,
  Leaf,
  X,
} from "lucide-react";
import Header, { RouteView } from "./components/Header";
import HomePage from "./pages/HomePage";
import TarjetaActividad, { ActividadItem } from "./components/TarjetaActividad";
import AuthViews from "./components/AuthViews";
import {
  apiFetch,
  getUserSession,
  clearUserSession,
} from "./api/client";
import { ProviderPortal, AdminAuditsPortal } from "./components/RoleDashboards";

export default function App() {
  const [view, setView] = useState<RouteView>("home");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [session, setSession] = useState(getUserSession());
  const [authNotice, setAuthNotice] = useState("");

  // Catálogo y filtros
  const [experiences, setExperiences] = useState<ActividadItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [onlyPetFriendly, setOnlyPetFriendly] = useState(false);
  const [onlyAccessible, setOnlyAccessible] = useState(false);

  // Detalle y Checkout
  const [detailExp, setDetailExp] = useState<ActividadItem | null>(null);
  const [checkoutExp, setCheckoutExp] = useState<ActividadItem | null>(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [guests, setGuests] = useState(2);
  const [accessNotes, setAccessNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingReceipt, setBookingReceipt] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  // Mis Reservas
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Guía IA
  const [aiMessage, setAiMessage] = useState(
    "Busco algo de naturaleza y accesible para ir con mi perro"
  );
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Panel BI (Admin)
  const [biData, setBiData] = useState<any>(null);
  const [biError, setBiError] = useState("");

  // Auditorías (Admin)
  const [pendingAudits, setPendingAudits] = useState<any[]>([]);
  const [auditNotes, setAuditNotes] = useState("Documentación ambiental verificada.");

  // Negocio / Proveedor
  const [docBusiness, setDocBusiness] = useState("Chinampas Vivas SC");
  const [docCategory, setDocCategory] = useState("Naturaleza");
  const [docDesc, setDocDesc] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docMsg, setDocMsg] = useState("");

  const [newExp, setNewExp] = useState({
    title: "",
    description: "",
    category: "Naturaleza",
    borough_cdmx: "Xochimilco",
    price: 650,
    duration_minutes: 180,
    max_capacity: 8,
    pet_friendly: true,
    accessible: true,
    sustainable_practices: "Cero plásticos de un solo uso y conservación de ecosistemas locales.",
  });
  const [expMsg, setExpMsg] = useState("");

  const loadCatalog = async () => {
    try {
      const list = await apiFetch<ActividadItem[]>("/api/catalog/experiences/");
      setExperiences(list);
    } catch {
      setExperiences([]);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (view === "reservas" && session.token) {
      apiFetch<any[]>("/api/bookings/reservations/my-bookings")
        .then(setMyBookings)
        .catch(() => setMyBookings([]));
    }
    if (view === "admin-bi") {
      setBiError("");
      apiFetch<any>("/api/bi/dashboard/summary")
        .then(setBiData)
        .catch((err) => setBiError(err.message));
    }
    if (view === "admin-auditorias") {
      apiFetch<any[]>("/api/catalog/audits/pending")
        .then(setPendingAudits)
        .catch(() => setPendingAudits([]));
    }
  }, [view, session.token]);

  const handleOpenCheckout = (actividad: ActividadItem) => {
    if (!session.token) {
      setAuthNotice("Inicia sesión para reservar experiencias sustentables.");
      setView("auth");
      return;
    }
    setBookingReceipt(null);
    setBookingError("");
    setCheckoutExp(actividad);
  };

  const handlePayBooking = async () => {
    if (!checkoutExp) return;
    setBookingLoading(true);
    setBookingError("");
    try {
      const pre = await apiFetch<any>("/api/bookings/reservations/reserve", {
        method: "POST",
        body: JSON.stringify({
          experience_id: checkoutExp.id,
          activity_date: bookingDate,
          guests_count: guests,
          accessibility_notes: accessNotes || undefined,
          unit_price: checkoutExp.price,
          max_ecological_capacity: checkoutExp.max_capacity,
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

      setBookingReceipt({
        ...paid,
        title: checkoutExp.title,
        date: bookingDate,
        guests,
        total: checkoutExp.price * guests + 50,
      });
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const res = await apiFetch<any>("/api/ai/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: aiMessage }),
      });
      setAiReply(res.assistant_reply || JSON.stringify(res));
    } catch (err: any) {
      setAiReply(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAuditDecision = async (auditId: number, decision: "APPROVED" | "REJECTED") => {
    try {
      await apiFetch(`/api/catalog/audits/${auditId}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision, reviewer_notes: auditNotes }),
      });
      setPendingAudits((prev) => prev.filter((a) => a.id !== auditId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocMsg("");
    try {
      const fd = new FormData();
      fd.append("business_name", docBusiness);
      fd.append("category", docCategory);
      fd.append("description", docDesc || "Evidencia de prácticas regenerativas y manejo de residuos.");
      const fileToSend =
        docFile || new File(["%PDF-1.4 evidencia"], "Certificacion_Ambiental.pdf", { type: "application/pdf" });
      fd.append("files", fileToSend);

      const res = await apiFetch<any>("/api/catalog/audits/submit", {
        method: "POST",
        body: fd,
      });
      setDocMsg(`Evidencia enviada correctamente (Auditoría ID #${res.audit_id}).`);
    } catch (err: any) {
      setDocMsg(`Error: ${err.message}`);
    }
  };

  const handleCreateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpMsg("");
    try {
      await apiFetch("/api/catalog/experiences/", {
        method: "POST",
        body: JSON.stringify({
          ...newExp,
          latitude: 19.2647,
          longitude: -99.1036,
          price: Number(newExp.price),
          duration_minutes: Number(newExp.duration_minutes),
          max_capacity: Number(newExp.max_capacity),
        }),
      });
      setExpMsg("Experiencia publicada exitosamente en el catálogo CDMX.");
      setNewExp({ ...newExp, title: "", description: "" });
      loadCatalog();
    } catch (err: any) {
      setExpMsg(`Error: ${err.message}`);
    }
  };

  const filteredExperiences = experiences.filter((e) => {
    const matchesSearch =
      !searchText ||
      e.title.toLowerCase().includes(searchText.toLowerCase()) ||
      e.borough_cdmx.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory =
      categoryFilter === "Todas" ||
      e.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesPet = !onlyPetFriendly || Boolean(e.pet_friendly);
    const matchesAccess = !onlyAccessible || Boolean(e.accessible);
    return matchesSearch && matchesCategory && matchesPet && matchesAccess;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header
        currentView={view}
        onNavigate={(next) => {
          setAuthNotice("");
          setView(next);
        }}
        session={session}
        onLogout={() => {
          clearUserSession();
          setSession(getUserSession());
          setView("home");
        }}
        lang={lang}
        onToggleLang={() => setLang(lang === "es" ? "en" : "es")}
      />

      {/* VISTA 1: HOME DINÁMICO POR ROL */}
      {view === "home" && <HomePage session={session} onNavigate={setView} />}

      {/* VISTA 2: EXPLORAR CATÁLOGO */}
      {view === "busqueda" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <span className="text-xs font-bold tracking-[0.2em] text-[#728C69] uppercase">
              Catálogo Verificado · Ciudad de México
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl mt-1">
              Explora experiencias sustentables
            </h1>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-4 sm:p-5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Buscar por actividad o alcaldía (ej. Xochimilco)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full md:w-80 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
            />

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {["Todas", "Naturaleza", "Cultura", "Relax", "Gastronomía"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                    categoryFilter === cat
                      ? "bg-[#728C69] text-white"
                      : "bg-[#F2EFE9] dark:bg-[#18201C] hover:bg-[#E3E5D8]"
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                onClick={() => setOnlyPetFriendly(!onlyPetFriendly)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  onlyPetFriendly
                    ? "bg-[#C81D77] text-white"
                    : "bg-[#F2EFE9] dark:bg-[#18201C]"
                }`}
              >
                Pet Friendly
              </button>
              <button
                onClick={() => setOnlyAccessible(!onlyAccessible)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  onlyAccessible
                    ? "bg-[#C81D77] text-white"
                    : "bg-[#F2EFE9] dark:bg-[#18201C]"
                }`}
              >
                Accesible
              </button>
            </div>
          </div>

          {filteredExperiences.length === 0 ? (
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron experiencias con esos filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((exp) => (
                <TarjetaActividad
                  key={exp.id}
                  actividad={exp}
                  onReservar={handleOpenCheckout}
                  onVerDetalle={setDetailExp}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* VISTA 3: AUTH (LOGIN / REGISTER) */}
      {view === "auth" && (
        <AuthViews
          initialError={authNotice}
          onSuccess={() => {
            setSession(getUserSession());
            setView("home");
          }}
        />
      )}

      {/* VISTA 4: MIS RESERVAS */}
      {view === "reservas" && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
          <h1 className="font-serif text-3xl mb-6">Mis Reservaciones Ecológicas</h1>
          {myBookings.length === 0 ? (
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Aún no tienes reservaciones registradas.
              </p>
              <button
                onClick={() => setView("busqueda")}
                className="bg-[#C81D77] text-white text-xs font-medium px-5 py-2.5 rounded-full"
              >
                Explorar experiencias
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-mono bg-[#EBE9E0] dark:bg-[#18201C] text-[#3B523E] dark:text-[#A5B29A] px-3 py-1 rounded-full">
                      Código de Acceso: {b.access_code || `TS-${b.id}`}
                    </span>
                    <h3 className="font-serif text-xl mt-2">
                      Experiencia #{b.experience_id} · {b.activity_date}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.guests_count} visitantes · Total pagado: ${b.total_amount} MXN
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 self-start sm:self-center">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* VISTA 5: GUÍA IA */}
      {view === "ia" && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#728C69]/15 text-[#728C69] text-xs font-bold uppercase mb-3">
              <Sparkles className="w-4 h-4" /> Recomendador Inteligente CDMX
            </div>
            <h1 className="font-serif text-3xl mb-2">Asistente de Turismo Regenerativo</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Cuéntanos qué buscas (alcaldía, accesibilidad, mascotas o intereses) y cruzaremos tu perfil con experiencias auditadas.
            </p>

            <form onSubmit={handleAskAi} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                required
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="Ej. Busco algo tranquilo en Xochimilco con mi perro..."
                className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-12 text-sm"
              />
              <button
                disabled={aiLoading}
                type="submit"
                className="bg-[#C81D77] hover:bg-[#A91864] text-white rounded-xl px-6 h-12 text-sm font-medium transition"
              >
                {aiLoading ? "Analizando..." : "Recomendar"}
              </button>
            </form>

            {aiReply && (
              <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-6 rounded-2xl text-sm leading-relaxed">
                {aiReply}
              </div>
            )}
          </div>
        </main>
      )}

      {/* VISTA 6: ADMIN - AUDITORÍAS */}
      {view === "admin-auditorias" && <AdminAuditsPortal />}

{(view === "negocio-documentos" || view === "negocio-dashboard") && (
  <ProviderPortal
    session={session}
    initialTab={view === "negocio-documentos" ? "evidencias" : "cuenta"}
    onCatalogUpdated={loadCatalog}
    onNavigateReservas={() => setView("reservas")}
  />
)}

      {/* VISTA 7: ADMIN - PANEL BI */}
      {view === "admin-bi" && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
          <h1 className="font-serif text-3xl mb-2">Panel BI e Impacto Ambiental</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Métricas consolidadas mediante eventos asíncronos en RabbitMQ.
          </p>

          {biError ? (
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-sm text-amber-700">
              Acceso restringido: {biError}. Inicia sesión con rol Administrador.
            </div>
          ) : biData?.kpis ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
                <span className="text-xs text-muted-foreground">Reservas Totales</span>
                <p className="font-serif text-4xl font-bold mt-2">{biData.kpis.total_bookings}</p>
              </div>
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
                <span className="text-xs text-muted-foreground">Ingresos Generados</span>
                <p className="font-serif text-4xl font-bold text-[#3B523E] dark:text-[#A5B29A] mt-2">
                  ${biData.kpis.total_revenue}
                </p>
              </div>
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
                <span className="text-xs text-muted-foreground">Fondo Ecológico</span>
                <p className="font-serif text-4xl font-bold text-[#728C69] mt-2">
                  ${biData.kpis.total_impact_fund}
                </p>
              </div>
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
                <span className="text-xs text-muted-foreground">Turistas Movilizados</span>
                <p className="font-serif text-4xl font-bold text-[#C81D77] mt-2">
                  {biData.kpis.total_tourists_mobilized}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cargando métricas analíticas...</p>
          )}
        </main>
      )}

      {/* VISTA 10: ACERCA DE NOSOTROS */}
      {view === "about" && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-8 sm:p-12 shadow-sm space-y-6">
            <span className="text-xs font-bold tracking-[0.2em] text-[#728C69] uppercase">
              Nuestra Misión
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl">
              Turismo regenerativo y verificación real contra el greenwashing
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conectamos a viajeros conscientes con cooperativas locales de la Ciudad de México mediante auditorías documentales verificables, control estricto de capacidad de carga ecológica en tiempo real y un fondo directo de conservación ambiental por cada reservación.
            </p>
          </div>
        </main>
      )}

      {/* MODAL DETALLE DE ACTIVIDAD */}
      {detailExp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-xl relative">
            <button
              onClick={() => setDetailExp(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F2EFE9] dark:bg-[#18201C] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#728C69] uppercase mb-2">
              <ShieldCheck className="w-4 h-4" /> Experiencia Verificada
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl mb-3">{detailExp.title}</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {detailExp.sustainable_practices}
            </p>
            <div className="grid grid-cols-3 gap-3 bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl text-xs mb-6">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#728C69]" /> {detailExp.borough_cdmx}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#728C69]" /> {detailExp.duration_minutes} min
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#728C69]" /> Máx {detailExp.max_capacity}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Tarifa por persona</span>
                <span className="text-xl font-bold">${detailExp.price} MXN</span>
              </div>
              <button
                onClick={() => {
                  const chosen = detailExp;
                  setDetailExp(null);
                  handleOpenCheckout(chosen);
                }}
                className="bg-[#C81D77] hover:bg-[#A91864] text-white text-sm font-medium px-6 py-3 rounded-full"
              >
                Reservar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT & PASE ECOLÓGICO */}
      {checkoutExp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] max-w-md w-full p-6 sm:p-8 shadow-xl">
            {bookingReceipt ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-2xl">¡Reservación Confirmada!</h2>
                <p className="text-xs text-muted-foreground">{bookingReceipt.title}</p>
                <div className="bg-[#F2EFE9] dark:bg-[#18201C] rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pase de Acceso Ecológico
                  </span>
                  <p className="font-mono text-xl font-bold text-[#728C69]">
                    {bookingReceipt.access_code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fecha: {bookingReceipt.date} · {bookingReceipt.guests} visitantes · Total: $
                    {bookingReceipt.total} MXN
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCheckoutExp(null);
                    setView("reservas");
                  }}
                  className="w-full bg-[#728C69] text-white rounded-xl h-12 text-sm font-medium"
                >
                  Ver en Mis Reservas
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs font-bold text-[#728C69] uppercase mb-1">
                  <Leaf className="w-4 h-4" /> Checkout Sustentable
                </div>
                <h2 className="font-serif text-2xl mb-1">{checkoutExp.title}</h2>
                <p className="text-xs text-muted-foreground mb-5">
                  {checkoutExp.borough_cdmx}, CDMX · Cupo ecológico máx: {checkoutExp.max_capacity}
                </p>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
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
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Número de visitantes</label>
                    <input
                      type="number"
                      min={1}
                      max={checkoutExp.max_capacity}
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Notas de accesibilidad (opcional)
                    </label>
                    <input
                      placeholder="Ej. Acceso a nivel de embarcadero"
                      value={accessNotes}
                      onChange={(e) => setAccessNotes(e.target.value)}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11"
                    />
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between font-bold">
                    <span>Total (+ $50 fondo ambiental)</span>
                    <span>${checkoutExp.price * guests + 50} MXN</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCheckoutExp(null)}
                    className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl h-11 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={bookingLoading}
                    onClick={handlePayBooking}
                    className="flex-1 bg-[#C81D77] hover:bg-[#A91864] text-white rounded-xl h-11 text-sm font-medium"
                  >
                    {bookingLoading ? "Validando cupo..." : "Confirmar y Pagar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}