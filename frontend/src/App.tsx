import React, { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Users,
  Leaf,
  X,
  Star,
  Camera,
  MessageSquare,
  Send,
  BarChart3,
  Lock,
} from "lucide-react";
import Header, { RouteView } from "./components/Header";
import HomePage from "./pages/HomePage";
import TarjetaActividad, { ActividadItem } from "./components/TarjetaActividad";
import AuthViews from "./components/AuthViews";
import { ProviderPortal, AdminAuditsPortal } from "./components/RoleDashboards";
import PerfilPortal from "./components/PerfilPortal";
import {
  apiFetch,
  decodeJwtPayload,
  getUserSession,
  clearUserSession,
} from "./api/client";

export interface ActividadConProveedor extends ActividadItem {
  provider_id?: number;
}

function getUserIdFromToken(token: string | null): number | null {
  const payload = decodeJwtPayload(token);
  const sub = payload?.sub !== undefined && payload?.sub !== null ? Number(payload.sub) : null;
  return sub !== null && Number.isFinite(sub) ? sub : null;
}

function getLocalDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [view, setView] = useState<RouteView>("home");
  const [lang, setLang] = useState<"es" | "en">("es");
  const [session, setSession] = useState(getUserSession());
  const [authNotice, setAuthNotice] = useState("");

  // Catálogo y filtros
  const [experiences, setExperiences] = useState<ActividadConProveedor[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [onlyPetFriendly, setOnlyPetFriendly] = useState(false);
  const [onlyAccessible, setOnlyAccessible] = useState(false);

  const isTourist = session.role?.toUpperCase() === "TOURIST";
  const currentUserId = session.userId ?? getUserIdFromToken(session.token);
  const canReserve = !session.token || isTourist;

  // Favoritos persistentes por usuario (sincronizados con booking-payment para TOURIST)
  const favKey = `ts_favs_${currentUserId ?? session.name ?? "guest"}`;
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(favKey) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (session.token && isTourist) {
      apiFetch<{ favorite_experience_ids?: number[] }>("/api/bookings/planning/favorites")
        .then((res) => {
          const ids = Array.isArray(res?.favorite_experience_ids)
            ? res.favorite_experience_ids.map(Number)
            : [];
          setFavoriteIds(ids);
          localStorage.setItem(favKey, JSON.stringify(ids));
        })
        .catch(() => {
          try {
            setFavoriteIds(JSON.parse(localStorage.getItem(favKey) || "[]"));
          } catch {
            setFavoriteIds([]);
          }
        });
    } else {
      try {
        setFavoriteIds(JSON.parse(localStorage.getItem(favKey) || "[]"));
      } catch {
        setFavoriteIds([]);
      }
    }
  }, [favKey, session.token, isTourist]);

  const toggleFavorite = async (id: number) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(favKey, JSON.stringify(next));
      return next;
    });
    if (session.token && isTourist) {
      try {
        const res = await apiFetch<any>(`/api/bookings/planning/favorites/${id}`, {
          method: "POST",
        });
        if (Array.isArray(res?.favorite_experience_ids)) {
          const ids = res.favorite_experience_ids.map(Number);
          setFavoriteIds(ids);
          localStorage.setItem(favKey, JSON.stringify(ids));
        }
      } catch {
        // Fallback local ya aplicado
      }
    }
  };

  // Detalle, Reseñas y Chat Directo (social-service)
  const [detailExp, setDetailExp] = useState<ActividadConProveedor | null>(null);
  const [detailTab, setDetailTab] = useState<"reviews" | "chat">("reviews");
  const [reviewsData, setReviewsData] = useState<{
    average_rating: number;
    total_reviews: number;
    reviews: any[];
  }>({ average_rating: 0, total_reviews: 0, reviews: [] });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewEcoVerified, setReviewEcoVerified] = useState(true);
  const [reviewPhotos, setReviewPhotos] = useState<FileList | null>(null);
  const reviewPhotosInputRef = useRef<HTMLInputElement | null>(null);
  const [reviewMsg, setReviewMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Estado del Chat con la cooperativa
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");

  // Checkout
  const [checkoutExp, setCheckoutExp] = useState<ActividadConProveedor | null>(null);
  const [bookingDate, setBookingDate] = useState(() => getLocalDateString(1));
  const [guests, setGuests] = useState(2);
  const [accessNotes, setAccessNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingReceipt, setBookingReceipt] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [pendingImpact, setPendingImpact] = useState<number | null>(null);

  // Mis Reservas (también se usa para validar elegibilidad de reseña)
  const [myBookings, setMyBookings] = useState<any[]>([]);

  // Guía IA
  const [aiMessage, setAiMessage] = useState(
    "Busco algo de naturaleza y accesible para ir con mi perro"
  );
  const [aiReply, setAiReply] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<ActividadConProveedor[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Panel BI (Admin)
  const [biData, setBiData] = useState<any>(null);
  const [biError, setBiError] = useState("");

  const loadCatalog = async () => {
    try {
      const list = await apiFetch<ActividadConProveedor[]>("/api/catalog/experiences/");
      setExperiences(list);
    } catch {
      setExperiences([]);
    }
  };

  const [bookingsError, setBookingsError] = useState("");
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const loadMyBookings = async () => {
    if (!session.token) {
      setMyBookings([]);
      return;
    }
    setBookingsLoading(true);
    setBookingsError("");
    try {
      const list = await apiFetch<any[]>("/api/bookings/reservations/my-bookings");
      setMyBookings(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setBookingsError(err.message || "Error al cargar reservaciones");
      setMyBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadReviews = async (experienceId: number) => {
    try {
      const data = await apiFetch<any>(`/api/social/reviews/experience/${experienceId}`);
      setReviewsData({
        average_rating: data.average_rating || 0,
        total_reviews: data.total_reviews || 0,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
      });
    } catch {
      setReviewsData({ average_rating: 0, total_reviews: 0, reviews: [] });
    }
  };

  const loadChat = async (exp: ActividadConProveedor) => {
    if (!session.token) return;
    const otherId = exp.provider_id || 1;
    try {
      const data = await apiFetch<any>(`/api/social/chat/history/${exp.id}/${otherId}`);
      setChatHistory(Array.isArray(data) ? data : data.messages || []);
    } catch {
      setChatHistory([]);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (session.token) {
      loadMyBookings();
    } else {
      setMyBookings([]);
    }
  }, [session.token]);

  useEffect(() => {
    setChatHistory([]);
    setReviewsData({ average_rating: 0, total_reviews: 0, reviews: [] });
    if (detailExp) {
      setDetailTab("reviews");
      setReviewMsg(null);
      setReviewComment("");
      setReviewPhotos(null);
      if (reviewPhotosInputRef.current) {
        reviewPhotosInputRef.current.value = "";
      }
      setChatError("");
      loadReviews(detailExp.id);
      if (session.token) {
        loadMyBookings();
        if (isTourist) {
          loadChat(detailExp);
        }
      }
    }
  }, [detailExp]);

  useEffect(() => {
    if (view === "reservas" && session.token) {
      loadMyBookings();
    }
    if (view === "admin-bi") {
      setBiError("");
      apiFetch<any>("/api/bi/dashboard/summary")
        .then(setBiData)
        .catch((err) => setBiError(err.message));
    }
  }, [view, session.token]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailExp) return;
    setReviewSubmitting(true);
    setReviewMsg(null);

    try {
      const fd = new FormData();
      fd.append("experienceId", String(detailExp.id));
      fd.append("rating", String(reviewRating));
      fd.append("comment", reviewComment.trim());
      fd.append("ecologicalComplianceVerified", String(reviewEcoVerified));
      if (reviewPhotos && reviewPhotos.length > 0) {
        Array.from(reviewPhotos).slice(0, 5).forEach((file) => fd.append("photos", file));
      }

      await apiFetch("/api/social/reviews/", {
        method: "POST",
        body: fd,
      });

      setReviewMsg({ type: "ok", text: "¡Reseña verificada publicada con éxito!" });
      setReviewComment("");
      setReviewPhotos(null);
      if (reviewPhotosInputRef.current) {
        reviewPhotosInputRef.current.value = "";
      }
      await loadReviews(detailExp.id);
    } catch (err: any) {
      setReviewMsg({ type: "err", text: err.message });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailExp || !chatText.trim()) return;
    setChatSending(true);
    setChatError("");
    const recipientId = detailExp.provider_id || 1;
    try {
      await apiFetch("/api/social/chat/send", {
        method: "POST",
        body: JSON.stringify({
          experienceId: detailExp.id,
          recipientId,
          content: chatText.trim(),
        }),
      });
      setChatText("");
      await loadChat(detailExp);
    } catch (err: any) {
      setChatError(err.message);
    } finally {
      setChatSending(false);
    }
  };

  const handleOpenCheckout = (actividad: ActividadConProveedor) => {
    if (!session.token) {
      setAuthNotice("Inicia sesión para reservar experiencias sustentables.");
      setView("auth");
      return;
    }
    if (!isTourist) {
      return;
    }
    setBookingReceipt(null);
    setBookingError("");
    setPendingBookingId(null);
    setPendingImpact(null);
    setAccessNotes("");
    setBookingDate(getLocalDateString(1));
    setGuests(Math.min(2, Math.max(1, actividad.max_capacity || 1)));
    setCheckoutExp(actividad);
  };

  const handleCancelCheckoutModal = async () => {
    if (bookingLoading) return;
    if (pendingBookingId) {
      try {
        await apiFetch(`/api/bookings/reservations/${pendingBookingId}/cancel`, {
          method: "POST",
        });
        await loadMyBookings();
      } catch {
        // Si ya expiró o falló la cancelación, cerramos el modal igualmente
      }
    }
    setPendingBookingId(null);
    setPendingImpact(null);
    setBookingError("");
    setCheckoutExp(null);
  };

  const handlePayBooking = async () => {
    if (!checkoutExp) return;
    setBookingLoading(true);
    setBookingError("");
    try {
      let bookingIdToPay = pendingBookingId;
      let impactContribution = pendingImpact;
      let preTotalAmount: number | null = null;

      if (!bookingIdToPay) {
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
        bookingIdToPay = pre.booking_id;
        impactContribution =
          typeof pre.impact_contribution === "number" ? pre.impact_contribution : null;
        preTotalAmount = typeof pre.total_amount === "number" ? pre.total_amount : null;
        setPendingBookingId(bookingIdToPay);
        setPendingImpact(impactContribution);
      }

      const paid = await apiFetch<any>("/api/bookings/reservations/pay", {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingIdToPay,
          payment_method: "CARD",
          simulate_failure: false,
        }),
      });

      const baseAmount = Number((checkoutExp.price * guests).toFixed(2));
      const fallbackImpact = Number((baseAmount * 0.05).toFixed(2));
      const finalImpact = impactContribution ?? fallbackImpact;
      const finalTotal =
        typeof paid.total_paid === "number"
          ? paid.total_paid
          : preTotalAmount ?? Number((baseAmount + finalImpact).toFixed(2));

      setPendingBookingId(null);
      setPendingImpact(null);
      setBookingReceipt({
        ...paid,
        title: checkoutExp.title,
        date: bookingDate,
        guests,
        impact_contribution: finalImpact,
        total: finalTotal,
      });
      await loadMyBookings();
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = aiMessage.trim();
    if (trimmed.length < 2) {
      setAiReply("Por favor escribe al menos 2 caracteres para buscar recomendaciones.");
      setAiSuggestions([]);
      return;
    }
    setAiLoading(true);
    try {
      const res = await apiFetch<any>("/api/ai/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });
      setAiReply(res.assistant_reply || JSON.stringify(res));
      setAiSuggestions(
        Array.isArray(res.suggested_experiences) ? res.suggested_experiences : []
      );
    } catch (err: any) {
      setAiReply(`Error: ${err.message}`);
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    clearUserSession();
    setSession(getUserSession());
    setBiData(null);
    setBiError("");
    setChatHistory([]);
    setReviewsData({ average_rating: 0, total_reviews: 0, reviews: [] });
    setDetailExp(null);
    setCheckoutExp(null);
    setBookingReceipt(null);
    setPendingBookingId(null);
    setPendingImpact(null);
    setAccessNotes("");
    setAiReply("");
    setAiSuggestions([]);
    setMyBookings([]);
    setView("home");
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

  // Reglas de elegibilidad para reseñar la experiencia abierta en detalle
  const hasVisitedExperience = detailExp
    ? myBookings.some(
        (b) =>
          Number(b.experience_id) === Number(detailExp.id) &&
          ["CONFIRMED", "PAID", "COMPLETED"].includes(String(b.status).toUpperCase())
      )
    : false;

  const hasAlreadyReviewed =
    currentUserId !== null &&
    reviewsData.reviews.some((rev: any) => Number(rev.touristId) === currentUserId);

  const categoryBreakdown = experiences.reduce<Record<string, number>>((acc, item) => {
    const key = item.category || "Ecoturismo";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header
        currentView={view}
        onNavigate={(next) => {
          setAuthNotice("");
          setView(next);
        }}
        session={session}
        onLogout={handleLogout}
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

          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-4 sm:p-5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Buscar por actividad o alcaldía (ej. Xochimilco)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full md:w-80 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
            />

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {[
                { value: "Todas", label: "Todas" },
                { value: "Naturaleza", label: "Naturaleza" },
                { value: "Cultura", label: "Cultura" },
                { value: "Viajes Tranquilos", label: "Relax" },
                { value: "Gastronomia", label: "Gastronomía" },
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                    categoryFilter === cat.value
                      ? "bg-[#728C69] text-white"
                      : "bg-[#F2EFE9] dark:bg-[#18201C] hover:bg-[#E3E5D8]"
                  }`}
                >
                  {cat.label}
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
                  isFavorite={favoriteIds.includes(exp.id)}
                  canReserve={canReserve}
                  onToggleFavorite={toggleFavorite}
                  onReservar={handleOpenCheckout}
                  onVerDetalle={setDetailExp}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* VISTA 3: AUTH */}
      {view === "auth" && (
        <AuthViews
          initialError={authNotice}
          onSuccess={() => {
            setSession(getUserSession());
            setView("home");
          }}
        />
      )}

      {/* VISTA 4: PERFIL Y FAVORITOS */}
      {view === "perfil" && (
        <PerfilPortal
          session={session}
          experiences={experiences}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onReservar={handleOpenCheckout}
          onVerDetalle={setDetailExp}
          onNavigate={setView}
          onLogout={handleLogout}
        />
      )}

      {/* VISTA 5: MIS RESERVAS */}
      {view === "reservas" && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-3xl">Mis Reservaciones Ecológicas</h1>
            <button
              onClick={loadMyBookings}
              className="text-xs bg-[#E3E5D8] dark:bg-[#2A312C] px-4 py-2 rounded-full font-medium hover:bg-[#728C69] hover:text-white transition"
            >
              Actualizar
            </button>
          </div>

          {bookingsError && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-xs mb-6">
              {bookingsError}
            </div>
          )}

          {bookingsLoading ? (
            <p className="text-sm text-muted-foreground">Cargando tus reservaciones...</p>
          ) : myBookings.length === 0 ? (
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Aún no tienes reservaciones registradas con esta cuenta ({session.name || "Invitado"}).
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
              {myBookings.map((b) => {
                const expInfo = experiences.find((e) => Number(e.id) === Number(b.experience_id));
                const st = String(b.status || "").toUpperCase();
                const statusBadgeClass =
                  st === "CONFIRMED" || st === "PAID" || st === "COMPLETED"
                    ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                    : st === "PENDING_PAYMENT"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-mono bg-[#EBE9E0] dark:bg-[#18201C] text-[#3B523E] dark:text-[#A5B29A] px-3 py-1 rounded-full">
                        Código de Acceso: {b.access_code || `TS-${b.id}`}
                      </span>
                      <h3 className="font-serif text-xl mt-2">
                        {expInfo ? expInfo.title : `Experiencia #${b.experience_id}`} · {b.activity_date}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {b.guests_count} visitantes · Total: ${b.total_amount} MXN
                      </p>
                    </div>
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-center ${statusBadgeClass}`}
                    >
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* VISTA 6: GUÍA IA */}
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
              <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-6 rounded-2xl text-sm leading-relaxed space-y-4">
                <p>{aiReply}</p>
                {aiSuggestions.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#728C69] mb-3">
                      Experiencias Sugeridas ({aiSuggestions.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiSuggestions.map((sug: any) => {
                        const fullExp =
                          experiences.find((e) => Number(e.id) === Number(sug.id)) || sug;
                        return (
                          <button
                            key={sug.id}
                            type="button"
                            onClick={() => setDetailExp(fullExp)}
                            className="text-left bg-white dark:bg-[#2A312C] rounded-2xl p-4 shadow-sm hover:border-[#728C69] border border-transparent transition-all"
                          >
                            <span className="text-[10px] font-bold uppercase text-[#728C69]">
                              {fullExp.category} · {fullExp.borough_cdmx}
                            </span>
                            <h4 className="font-serif text-base font-bold mt-1 line-clamp-1">
                              {fullExp.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              ${fullExp.price} MXN · Ver detalle →
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* VISTA 7: ADMIN - AUDITORÍAS */}
      {view === "admin-auditorias" && <AdminAuditsPortal onCatalogUpdated={loadCatalog} />}
      {/* VISTA 8: ADMIN - PANEL BI COMPLETO */}
      {view === "admin-bi" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 space-y-8">
          <div>
            <h1 className="font-serif text-3xl mb-2">Panel BI e Impacto Ambiental</h1>
            <p className="text-sm text-muted-foreground">
              Métricas consolidadas mediante eventos asíncronos en RabbitMQ y catálogo PostGIS.
            </p>
          </div>

          {biError ? (
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-sm text-amber-700">
              Acceso restringido: {biError}. Inicia sesión con rol Administrador.
            </div>
          ) : biData?.kpis ? (
            <>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-[#728C69]" />
                    <h2 className="font-serif text-xl">Desempeño por Categoría (BI)</h2>
                  </div>
                  <div className="space-y-4">
                    {Array.isArray(biData.by_category) && biData.by_category.length > 0 ? (
                      (() => {
                        const maxBookings = Math.max(
                          1,
                          ...biData.by_category.map((c: any) => Number(c.bookings || c.count || 0))
                        );
                        return biData.by_category.map((item: any, idx: number) => {
                          const cat = item.category || "Ecoturismo";
                          const count = Number(item.bookings ?? item.count ?? 0);
                          const revenue = item.revenue !== undefined ? Number(item.revenue) : null;
                          const pct = Math.min(100, Math.round((count / maxBookings) * 100));
                          return (
                            <div key={`${cat}-${idx}`} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-medium">
                                <span>{cat}</span>
                                <span>
                                  {count} reserva{count === 1 ? "" : "s"}
                                  {revenue !== null ? ` · $${revenue.toFixed(2)} MXN` : ""}
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-[#F2EFE9] dark:bg-[#18201C] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#728C69] rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      Object.entries(categoryBreakdown).map(([cat, count]) => {
                        const pct = Math.min(
                          100,
                          Math.round((count / Math.max(1, experiences.length)) * 100)
                        );
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{cat}</span>
                              <span>
                                {count} experiencia{count === 1 ? "" : "s"} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-[#F2EFE9] dark:bg-[#18201C] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#728C69] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#C81D77]">
                      Impacto Regenerativo CDMX
                    </span>
                    <h2 className="font-serif text-xl mt-1 mb-3">
                      Distribución del Fondo de Conservación
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Cada reservación aporta un 5% directo a proyectos de conservación de suelo de conservación, reforestación y saneamiento de canales en la Ciudad de México.
                    </p>
                  </div>

                  {Array.isArray(biData.top_providers) && biData.top_providers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#728C69] mb-2">
                        Top Proveedores Sustentables
                      </h3>
                      <div className="space-y-2">
                        {biData.top_providers.map((prov: any, idx: number) => (
                          <div
                            key={prov.provider_id ?? idx}
                            className="flex items-center justify-between text-xs bg-[#F2EFE9] dark:bg-[#18201C] px-3 py-2 rounded-xl"
                          >
                            <span className="font-semibold">
                              {prov.provider_name || `Proveedor #${prov.provider_id}`}
                            </span>
                            <span className="text-muted-foreground">
                              {prov.bookings ?? prov.total_bookings ?? 0} reservas · $
                              {Number(prov.revenue ?? prov.total_revenue ?? 0).toFixed(2)} MXN
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-[#F2EFE9] dark:bg-[#18201C] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">
                        Promedio de aporte por turista
                      </span>
                      <span className="font-serif text-2xl font-bold text-[#728C69]">
                        $
                        {biData.kpis.total_tourists_mobilized > 0
                          ? (
                              biData.kpis.total_impact_fund /
                              biData.kpis.total_tourists_mobilized
                            ).toFixed(2)
                          : "0.00"}{" "}
                        MXN
                      </span>
                    </div>
                    <Leaf className="w-8 h-8 text-[#728C69]" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Cargando métricas analíticas...</p>
          )}
        </main>
      )}

      {/* VISTA 9: PROVEEDOR - PORTAL COMPLETO */}
      {(view === "negocio-documentos" ||
        view === "negocio-dashboard" ||
        view === "negocio-nueva") && (
        <ProviderPortal
          session={session}
          initialTab={
            view === "negocio-documentos"
              ? "evidencias"
              : view === "negocio-nueva"
              ? "nuevaExp"
              : "cuenta"
          }
          onCatalogUpdated={loadCatalog}
          onNavigateReservas={() => setView("reservas")}
        />
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

      {/* MODAL DETALLE DE ACTIVIDAD + RESEÑAS VERIFICADAS + CHAT DIRECTO */}
      {detailExp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailExp(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F2EFE9] dark:bg-[#18201C] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#728C69] uppercase">
                <ShieldCheck className="w-4 h-4" /> Experiencia Verificada
              </span>
              {reviewsData.total_reviews > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {reviewsData.average_rating} ({reviewsData.total_reviews})
                </span>
              )}
            </div>

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

            <div className="flex items-center justify-between pb-6 border-b border-border">
              <div>
                <span className="text-xs text-muted-foreground block">Tarifa por persona</span>
                <span className="text-xl font-bold">${detailExp.price} MXN</span>
              </div>
              {canReserve ? (
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
              ) : (
                <span className="text-xs text-muted-foreground bg-[#F2EFE9] dark:bg-[#18201C] px-4 py-2 rounded-full">
                  Solo cuentas Turista pueden reservar
                </span>
              )}
            </div>

            {/* PESTAÑAS SOCIALES */}
            <div className="flex gap-2 mt-5 mb-4">
              <button
                onClick={() => setDetailTab("reviews")}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  detailTab === "reviews"
                    ? "bg-[#728C69] text-white"
                    : "bg-[#F2EFE9] dark:bg-[#18201C]"
                }`}
              >
                Reseñas Verificadas ({reviewsData.total_reviews})
              </button>
              {isTourist && (
                <button
                  onClick={() => setDetailTab("chat")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                    detailTab === "chat"
                      ? "bg-[#728C69] text-white"
                      : "bg-[#F2EFE9] dark:bg-[#18201C]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Contactar Cooperativa
                </button>
              )}
            </div>

            {detailTab === "reviews" ? (
              <div className="space-y-5">
                {session.token && isTourist && (
                  <>
                    {hasAlreadyReviewed ? (
                      <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl text-xs flex items-center gap-2.5 text-[#3B523E] dark:text-[#A5B29A]">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#728C69]" />
                        <span>
                          Ya publicaste tu reseña verificada para esta experiencia (límite de 1 reseña por visitante).
                        </span>
                      </div>
                    ) : !hasVisitedExperience ? (
                      <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Lock className="w-4 h-4 shrink-0 text-[#C81D77]" />
                          <span>
                            Para evitar reseñas falsas, debes reservar y visitar esta experiencia antes de calificarla.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const chosen = detailExp;
                            setDetailExp(null);
                            handleOpenCheckout(chosen);
                          }}
                          className="shrink-0 bg-[#728C69] text-white px-3 py-1.5 rounded-xl font-semibold"
                        >
                          Reservar
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSubmitReview}
                        className="bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold">Comparte tu experiencia verificada</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="p-0.5"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= reviewRating
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-gray-400"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          required
                          rows={2}
                          placeholder="¿Cómo fue la experiencia y el cuidado ambiental del lugar?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="w-full bg-white dark:bg-[#2A312C] rounded-xl p-3 text-xs"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={reviewEcoVerified}
                              onChange={(e) => setReviewEcoVerified(e.target.checked)}
                            />
                            <span>Confirmo cumplimiento ecológico real</span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#728C69] font-medium">
                            <Camera className="w-3.5 h-3.5" />
                            <span>
                              {reviewPhotos?.length
                                ? `${reviewPhotos.length} foto(s) lista(s)`
                                : "Adjuntar fotos"}
                            </span>
                            <input
                              ref={reviewPhotosInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => setReviewPhotos(e.target.files)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {reviewMsg && (
                          <p
                            className={`text-xs ${
                              reviewMsg.type === "ok" ? "text-green-700" : "text-red-600"
                            }`}
                          >
                            {reviewMsg.text}
                          </p>
                        )}

                        <button
                          disabled={reviewSubmitting}
                          type="submit"
                          className="bg-[#728C69] hover:bg-[#5B7153] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                        >
                          {reviewSubmitting ? "Publicando..." : "Publicar reseña"}
                        </button>
                      </form>
                    )}
                  </>
                )}

                {reviewsData.reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aún no hay reseñas para esta experiencia. ¡Sé el primero en compartir tu visita!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviewsData.reviews.map((rev: any) => (
                      <div
                        key={rev._id}
                        className="p-4 rounded-2xl bg-[#F2EFE9]/70 dark:bg-[#18201C]/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">Turista #{rev.touristId}</span>
                            {rev.ecologicalComplianceVerified && (
                              <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                                Cumplimiento ecológico verificado
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-amber-600">★ {rev.rating}/5</span>
                        </div>
                        <p className="text-xs text-foreground">{rev.comment}</p>
                        {Array.isArray(rev.photoKeys) && rev.photoKeys.length > 0 && (
                          <div className="pt-1.5">
                            <p className="text-[10px] text-[#728C69] font-medium mb-1.5">
                              {rev.photoKeys.length} fotografía(s) probatoria(s) en RustFS/S3
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {rev.photoKeys.map((_: any, photoIdx: number) => {
                                const photoUrl = `/api/social/reviews/${rev._id}/photos/${photoIdx}`;
                                return (
                                  <a
                                    key={photoIdx}
                                    href={photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-16 h-16 rounded-xl overflow-hidden border border-border bg-white dark:bg-[#2A312C]"
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`Evidencia ${photoIdx + 1}`}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!session.token ? (
                  <p className="text-xs text-muted-foreground">
                    Inicia sesión como turista para enviar consultas directas a la cooperativa.
                  </p>
                ) : (
                  <>
                    <div className="bg-[#F2EFE9] dark:bg-[#18201C] rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                      {chatHistory.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Inicia una conversación con la cooperativa sobre horarios, accesibilidad o transporte público.
                        </p>
                      ) : (
                        chatHistory.map((m: any, idx: number) => (
                          <div
                            key={m._id || idx}
                            className="bg-white dark:bg-[#2A312C] rounded-xl p-2.5 text-xs"
                          >
                            <span className="font-bold text-[#728C69] block mb-0.5">
                              {m.senderRole === "PROVIDER" ? "Cooperativa" : `Turista #${m.senderId}`}
                            </span>
                            <span>{m.content}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {chatError && <p className="text-xs text-red-600">{chatError}</p>}

                    <form onSubmit={handleSendChat} className="flex gap-2">
                      <input
                        required
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="Escribe tu consulta para la cooperativa..."
                        className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-3 h-10 text-xs"
                      />
                      <button
                        disabled={chatSending}
                        type="submit"
                        className="bg-[#C81D77] text-white px-4 rounded-xl text-xs font-medium flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Enviar
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT & PASE ECOLÓGICO */}
      {checkoutExp && (() => {
        const todayLocal = getLocalDateString(0);
        const maxCap = Math.max(1, checkoutExp.max_capacity || 1);
        const baseAmount = Number((checkoutExp.price * guests).toFixed(2));
        const impactAmount = Number((baseAmount * 0.05).toFixed(2));
        const totalAmount = Number((baseAmount + impactAmount).toFixed(2));
        return (
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
                    Fecha: {bookingReceipt.date} · {bookingReceipt.guests} visitantes
                  </p>
                  <p className="text-xs text-[#728C69] font-medium">
                    Fondo ambiental (5%): ${Number(bookingReceipt.impact_contribution ?? 0).toFixed(2)} MXN
                  </p>
                  <p className="text-xs font-bold">
                    Total pagado: ${Number(bookingReceipt.total ?? 0).toFixed(2)} MXN
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
                  {checkoutExp.borough_cdmx}, CDMX · Cupo ecológico máx: {maxCap}
                </p>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {pendingBookingId && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs mb-4">
                    Tu cupo sigue apartado (Reserva #{pendingBookingId}). Puedes reintentar el pago sin crear duplicados o cancelar para liberar el cupo.
                  </div>
                )}

                <div className="space-y-4 mb-6 text-sm">
                  <div>
                    <label className="block text-xs font-medium mb-1">Fecha de visita</label>
                    <input
                      type="date"
                      disabled={bookingLoading || Boolean(pendingBookingId)}
                      value={bookingDate}
                      min={todayLocal}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Número de visitantes</label>
                    <input
                      type="number"
                      disabled={bookingLoading || Boolean(pendingBookingId)}
                      min={1}
                      max={maxCap}
                      value={guests}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (Number.isNaN(val)) return;
                        setGuests(Math.min(maxCap, Math.max(1, val)));
                      }}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Notas de accesibilidad (opcional)
                    </label>
                    <input
                      disabled={bookingLoading || Boolean(pendingBookingId)}
                      placeholder="Ej. Acceso a nivel de embarcadero"
                      value={accessNotes}
                      onChange={(e) => setAccessNotes(e.target.value)}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 disabled:opacity-60"
                    />
                  </div>
                  <div className="pt-3 border-t border-border space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({guests} visitante{guests === 1 ? "" : "s"})</span>
                      <span>${baseAmount.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-[#728C69]">
                      <span>Fondo ambiental (5%)</span>
                      <span>${impactAmount.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1">
                      <span>Total</span>
                      <span>${totalAmount.toFixed(2)} MXN</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={bookingLoading}
                    onClick={handleCancelCheckoutModal}
                    className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl h-11 text-sm font-medium disabled:opacity-50"
                  >
                    {pendingBookingId ? "Cancelar reserva" : "Cancelar"}
                  </button>
                  <button
                    disabled={bookingLoading}
                    onClick={handlePayBooking}
                    className="flex-1 bg-[#C81D77] hover:bg-[#A91864] text-white rounded-xl h-11 text-sm font-medium disabled:opacity-50"
                  >
                    {bookingLoading
                      ? "Procesando..."
                      : pendingBookingId
                      ? "Reintentar Pago"
                      : "Confirmar y Pagar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        );
      })()}
    </div>
  );
}