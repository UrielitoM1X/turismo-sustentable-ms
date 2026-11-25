import React, { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  FileText,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  User,
  Paperclip,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  Send,
} from "lucide-react";
import { apiFetch, getUserSession } from "../api/client";

const ALCALDIAS_COORDS: Record<string, { lat: number; lng: number }> = {
  "Alvaro Obregon": { lat: 19.3587, lng: -99.2033 },
  Azcapotzalco: { lat: 19.4869, lng: -99.1859 },
  "Benito Juarez": { lat: 19.3719, lng: -99.1578 },
  Coyoacan: { lat: 19.3467, lng: -99.1617 },
  "Cuajimalpa de Morelos": { lat: 19.3574, lng: -99.2998 },
  Cuauhtemoc: { lat: 19.4414, lng: -99.1518 },
  "Gustavo A. Madero": { lat: 19.4829, lng: -99.1135 },
  Iztacalco: { lat: 19.3958, lng: -99.0977 },
  Iztapalapa: { lat: 19.3574, lng: -99.0671 },
  "La Magdalena Contreras": { lat: 19.3143, lng: -99.2417 },
  "Miguel Hidalgo": { lat: 19.4079, lng: -99.1917 },
  "Milpa Alta": { lat: 19.1923, lng: -99.0231 },
  Tlahuac: { lat: 19.2869, lng: -99.0052 },
  Tlalpan: { lat: 19.2886, lng: -99.1672 },
  "Venustiano Carranza": { lat: 19.4194, lng: -99.1138 },
  Xochimilco: { lat: 19.2647, lng: -99.1036 },
};

const ALCALDIAS_CDMX = Object.keys(ALCALDIAS_COORDS);

const CATEGORIAS_CATALOGO = [
  { value: "Naturaleza", label: "Naturaleza" },
  { value: "Gastronomia", label: "Gastronomía" },
  { value: "Cultura", label: "Cultura" },
  { value: "Viajes Tranquilos", label: "Relax / Viajes Tranquilos" },
];

// ============================================================================
// 1. PANEL DE PROVEEDOR (MI CUENTA + CREAR ACTIVIDAD + ESTADO REAL EN BD)
// ============================================================================
interface ProviderPortalProps {
  session: { token: string | null; role: string | null; name: string | null };
  initialTab?: "cuenta" | "resumen" | "evidencias" | "nuevaExp" | "mensajes";
  onCatalogUpdated: () => void;
  onNavigateReservas: () => void;
}

export function ProviderPortal({
  session,
  initialTab = "cuenta",
  onCatalogUpdated,
  onNavigateReservas,
}: ProviderPortalProps) {
  const [activeTab, setActiveTab] = useState<"cuenta" | "solicitudes" | "nuevaExp" | "mensajes">(
    initialTab === "cuenta"
      ? "cuenta"
      : initialTab === "resumen"
      ? "solicitudes"
      : initialTab === "mensajes"
      ? "mensajes"
      : "nuevaExp"
  );
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditsError, setAuditsError] = useState("");
  const [myAudits, setMyAudits] = useState<any[]>([]);
  const [createdAuditId, setCreatedAuditId] = useState<number | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  // Mensajes de turistas (social-chat)
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [convsError, setConvsError] = useState("");
  const [selectedConv, setSelectedConv] = useState<{ experienceId: number; otherUserId: number } | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Formulario unificado: Datos de Actividad + Evidencias Ambientales
  const [businessName, setBusinessName] = useState(session.name || "Cooperativa Sustentable CDMX");
  const [expTitulo, setExpTitulo] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expCategoria, setExpCategoria] = useState("Naturaleza");
  const [expAlcaldia, setExpAlcaldia] = useState("Xochimilco");
  const [expPrecio, setExpPrecio] = useState(650);
  const [expDuracion, setExpDuracion] = useState(180);
  const [expCapacidad, setExpCapacidad] = useState(10);
  const [expPracticas, setExpPracticas] = useState(
    "Cero plásticos de un solo uso, energía solar y conservación de suelo."
  );
  const [petFriendly, setPetFriendly] = useState(true);
  const [accessible, setAccessible] = useState(true);
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);

  const loadMyAudits = async () => {
    setLoadingAudits(true);
    setAuditsError("");
    try {
      const list = await apiFetch<any[]>("/api/catalog/audits/my-audits");
      setMyAudits(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setAuditsError(err.message || "Error al consultar tus solicitudes de auditoría.");
      setMyAudits([]);
    } finally {
      setLoadingAudits(false);
    }
  };

  const loadConversations = async () => {
    setLoadingConvs(true);
    setConvsError("");
    try {
      const data = await apiFetch<any>("/api/social/chat/conversations");
      const list = Array.isArray(data) ? data : data?.conversations || [];
      setConversations(list);
    } catch (err: any) {
      setConvsError(err.message || "Error al cargar conversaciones.");
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadConversationHistory = async (experienceId: number, otherUserId: number) => {
    setReplyError("");
    try {
      const data = await apiFetch<any>(`/api/social/chat/history/${experienceId}/${otherUserId}`);
      setConvMessages(Array.isArray(data) ? data : data?.messages || []);
    } catch (err: any) {
      setReplyError(err.message || "No se pudo cargar el historial del chat.");
      setConvMessages([]);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim()) return;
    setReplySending(true);
    setReplyError("");
    try {
      await apiFetch("/api/social/chat/send", {
        method: "POST",
        body: JSON.stringify({
          experienceId: selectedConv.experienceId,
          recipientId: selectedConv.otherUserId,
          content: replyText.trim(),
        }),
      });
      setReplyText("");
      await loadConversationHistory(selectedConv.experienceId, selectedConv.otherUserId);
      await loadConversations();
    } catch (err: any) {
      setReplyError(err.message || "Error al enviar la respuesta.");
    } finally {
      setReplySending(false);
    }
  };

  useEffect(() => {
    if (initialTab === "cuenta") setActiveTab("cuenta");
    else if (initialTab === "resumen") setActiveTab("solicitudes");
    else if (initialTab === "mensajes") setActiveTab("mensajes");
    else setActiveTab("nuevaExp");
  }, [initialTab]);

  useEffect(() => {
    loadMyAudits();
  }, [session.token]);

  useEffect(() => {
    if (activeTab === "solicitudes") {
      loadMyAudits();
    }
    if (activeTab === "mensajes") {
      loadConversations();
    }
  }, [activeTab]);

  const handleCrearActividadConEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const tituloTrim = expTitulo.trim();
      const descTrim = expDesc.trim();
      const practicasTrim = expPracticas.trim();

      if (tituloTrim.length < 5) {
        throw new Error("El título debe tener al menos 5 caracteres válidos (sin solo espacios).");
      }
      if (descTrim.length < 20) {
        throw new Error("La descripción debe tener al menos 20 caracteres válidos.");
      }
      if (practicasTrim.length < 10) {
        throw new Error("Describe tus prácticas sustentables en al menos 10 caracteres.");
      }
      if (!createdAuditId && (!evidenceFiles || evidenceFiles.length === 0)) {
        throw new Error("Debes adjuntar al menos un archivo de evidencia ecológica (PDF o imagen).");
      }

      // 1. Subir evidencias y generar solicitud de auditoría PENDING (si no se creó ya en un intento previo)
      let auditId = createdAuditId;
      if (!auditId) {
        const fd = new FormData();
        fd.append("business_name", `${businessName.trim()} — ${tituloTrim}`);
        fd.append("category", expCategoria);
        fd.append(
          "description",
          `${descTrim} | Prácticas sustentables: ${practicasTrim} (${expAlcaldia}, CDMX)`
        );
        Array.from(evidenceFiles!).forEach((f) => fd.append("files", f));

        const auditRes = await apiFetch<any>("/api/catalog/audits/submit", {
          method: "POST",
          body: fd,
        });
        auditId = auditRes.audit_id;
        setCreatedAuditId(auditId);
      }

      const coords = ALCALDIAS_COORDS[expAlcaldia] || { lat: 19.4326, lng: -99.1332 };

      // 2. Registrar la actividad en PostGIS como INACTIVA (is_active=False) hasta aprobación del Admin
      await apiFetch<any>("/api/catalog/experiences/", {
        method: "POST",
        body: JSON.stringify({
          title: tituloTrim,
          description: descTrim,
          category: expCategoria,
          borough_cdmx: expAlcaldia,
          latitude: coords.lat,
          longitude: coords.lng,
          price: Number(expPrecio),
          duration_minutes: Number(expDuracion),
          max_capacity: Math.min(50, Math.max(1, Number(expCapacidad))),
          pet_friendly: petFriendly,
          accessible,
          sustainable_practices: practicasTrim,
        }),
      });

      const filesCount = evidenceFiles?.length || 1;
      setFeedback({
        type: "success",
        text: `¡Actividad "${tituloTrim}" y ${filesCount} evidencia(s) enviadas! Quedó registrada en Auditoría #${auditId} y aparecerá en el catálogo público en cuanto un Administrador la apruebe.`,
      });
      setCreatedAuditId(null);
      setExpTitulo("");
      setExpDesc("");
      setEvidenceFiles(null);
      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = "";
      }
      await loadMyAudits();
      setActiveTab("solicitudes");
      onCatalogUpdated();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap bg-[#E3E5D8] dark:bg-[#2A312C] p-1 rounded-xl mb-8 max-w-2xl">
          {[
            { id: "cuenta", label: "Mi Cuenta" },
            { id: "nuevaExp", label: "+ Nueva Actividad y Evidencias" },
            { id: "solicitudes", label: `Mis Solicitudes (${myAudits.length})` },
            { id: "mensajes", label: "Mensajes" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setFeedback(null);
                setActiveTab(t.id as any);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === t.id
                  ? "bg-white dark:bg-[#3D453F] text-[#1E201D] dark:text-white shadow-sm"
                  : "text-[#63665E] dark:text-[#A5B29A]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs mb-6 text-center font-medium ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* SUBVISTA A: MI CUENTA */}
        {activeTab === "cuenta" && (
          <div className="max-w-md mx-auto flex flex-col">
            <h1 className="font-serif text-3xl text-[#1E201D] dark:text-white mb-6">Mi cuenta</h1>

            <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-5 mb-6 shadow-sm border border-transparent dark:border-white/5">
              <div className="w-full h-32 bg-[#B4CBB0] rounded-xl mb-4 relative overflow-hidden">
                <svg viewBox="0 0 400 120" className="w-full h-full object-cover" preserveAspectRatio="none">
                  <circle cx="320" cy="40" r="20" fill="#F4E6B4" />
                  <polygon points="0,120 150,50 350,120" fill="#758C6E" />
                  <polygon points="100,120 280,70 450,120" fill="#586E52" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-[#1E201D] dark:text-white mb-1">
                {businessName}
              </h2>
              <p className="text-sm text-[#8C9287] dark:text-[#9EA399] mb-2">
                Cooperativa ecoturística verificable en Ciudad de México.
              </p>
              <div className="flex text-[10px] text-[#63665E] dark:text-[#A5B29A] gap-2 font-medium">
                <span>Sello Verde</span>
                <span>·</span>
                <span className="uppercase">{expCategoria}</span>
                <span>·</span>
                <span>{expAlcaldia}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setActiveTab("nuevaExp")}
                className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
              >
                <span className="text-base font-medium">Crear Actividad y Subir Evidencias</span>
                <ArrowRight className="w-4 h-4 text-[#8C9287]" />
              </button>

              <button
                onClick={() => setActiveTab("solicitudes")}
                className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
              >
                <span className="text-base font-medium">Estado de mis Auditorías</span>
                <ArrowRight className="w-4 h-4 text-[#8C9287]" />
              </button>

              <button
                onClick={() => setActiveTab("mensajes")}
                className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
              >
                <span className="text-base font-medium">Mensajes de Turistas</span>
                <ArrowRight className="w-4 h-4 text-[#8C9287]" />
              </button>

              <button
                onClick={onNavigateReservas}
                className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
              >
                <span className="text-base font-medium">Reservas</span>
                <ArrowRight className="w-4 h-4 text-[#8C9287]" />
              </button>
            </div>
          </div>
        )}

        {/* SUBVISTA B: CREAR ACTIVIDAD + ADJUNTAR EVIDENCIAS EN UN SOLO PASO */}
        {activeTab === "nuevaExp" && (
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif mb-1 font-bold">
              Dar de Alta Experiencia Sustentable
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Completa los datos de tu experiencia y adjunta tus documentos o fotografías probatorias. Un Administrador revisará tu expediente antes de publicarlo en el catálogo.
            </p>

            <form onSubmit={handleCrearActividadConEvidencia} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Nombre de la Cooperativa / Negocio
                  </label>
                  <input
                    required
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">
                    Título de la Actividad (mín. 5 caracteres)
                  </label>
                  <input
                    required
                    minLength={5}
                    type="text"
                    value={expTitulo}
                    onChange={(e) => setExpTitulo(e.target.value)}
                    placeholder="ej. Amanecer en Chinampa Agroecológica"
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">
                  Descripción Detallada (mín. 20 caracteres)
                </label>
                <textarea
                  required
                  minLength={20}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Explica el recorrido, actividades y su aporte ambiental..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Categoría</label>
                  <select
                    value={expCategoria}
                    onChange={(e) => setExpCategoria(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  >
                    {CATEGORIAS_CATALOGO.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Alcaldía CDMX</label>
                  <select
                    value={expAlcaldia}
                    onChange={(e) => setExpAlcaldia(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  >
                    {ALCALDIAS_CDMX.map((alc) => (
                      <option key={alc} value={alc}>
                        {alc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Precio (MXN)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={expPrecio}
                    onChange={(e) => setExpPrecio(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Duración (min)</label>
                  <input
                    required
                    type="number"
                    min={15}
                    value={expDuracion}
                    onChange={(e) => setExpDuracion(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Capacidad Máx (1-50)</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={50}
                    value={expCapacidad}
                    onChange={(e) => setExpCapacidad(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  />
                </div>
              </div>

              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={petFriendly}
                    onChange={(e) => setPetFriendly(e.target.checked)}
                  />
                  Pet Friendly
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessible}
                    onChange={(e) => setAccessible(e.target.checked)}
                  />
                  Accesible
                </label>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">
                  Prácticas Sustentables (mín. 10 caracteres)
                </label>
                <input
                  required
                  minLength={10}
                  type="text"
                  value={expPracticas}
                  onChange={(e) => setExpPracticas(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F1EA] dark:bg-[#1E2420] border border-dashed border-[#728C69]/50 space-y-2">
                <label className="text-xs font-bold flex items-center gap-1.5 text-[#3B523E] dark:text-[#A5B29A]">
                  <Paperclip className="w-4 h-4 text-[#728C69]" />
                  Evidencias Ambientales Obligatorias (PDF, JPG, PNG)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Adjunta permisos ambientales, certificaciones o fotografías reales de tus instalaciones y manejo de residuos.
                </p>
                <input
                  ref={evidenceInputRef}
                  required={!createdAuditId}
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={(e) => setEvidenceFiles(e.target.files)}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-[#2A312C]"
                />
                {createdAuditId && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Las evidencias ya fueron cargadas en Auditoría #{createdAuditId}. Al reenviar se registrará solo la experiencia sin duplicar auditorías.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C81D77] hover:bg-[#A91864] text-white py-3.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Subiendo evidencias y enviando a auditoría..."
                  : "Enviar Actividad y Evidencias a Validación"}
              </button>
            </form>
          </div>
        )}

        {/* SUBVISTA C: MIS SOLICITUDES EN AUDITORÍA */}
        {activeTab === "solicitudes" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 mb-6 border bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-start justify-between gap-3.5">
              <div className="flex items-start gap-3.5">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">Validación contra Greenwashing</h3>
                  <p className="text-xs mt-1 leading-relaxed">
                    Consulta aquí el dictamen oficial de tus actividades enviadas. Cuando un Administrador apruebe tu expediente, tu experiencia aparecerá automáticamente en el catálogo público.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadMyAudits}
                disabled={loadingAudits}
                className="shrink-0 inline-flex items-center gap-1.5 bg-white dark:bg-[#2A312C] text-[#1E201D] dark:text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm hover:bg-[#E3E5D8]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudits ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            {auditsError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300">
                {auditsError}
              </div>
            )}

            {loadingAudits ? (
              <p className="text-sm text-muted-foreground">Consultando estado de auditorías...</p>
            ) : myAudits.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#2A312C] rounded-2xl border border-dashed border-[#8C9287]/40">
                <UploadCloud className="h-10 w-10 text-[#728C69] mx-auto mb-2" />
                <p className="text-sm text-[#8C9287] mb-3">
                  Aún no has enviado actividades con evidencias a auditoría.
                </p>
                <button
                  onClick={() => setActiveTab("nuevaExp")}
                  className="text-xs bg-[#728C69] text-white px-4 py-2 rounded-xl font-medium"
                >
                  Registrar mi primera actividad
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myAudits.map((doc) => {
                  const statusUpper = String(doc.status || "PENDING").toUpperCase();
                  const isApproved = statusUpper === "APPROVED";
                  const isRejected = statusUpper === "REJECTED";

                  return (
                    <div
                      key={doc.id}
                      className="bg-white dark:bg-[#2A312C] rounded-2xl p-5 shadow-sm space-y-2.5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-[#728C69] uppercase tracking-wider">
                          Auditoría #{doc.id} · {doc.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isRejected
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isApproved
                            ? "APROBADA Y PUBLICADA"
                            : isRejected
                            ? "RECHAZADA"
                            : "PENDIENTE DE VALIDACIÓN"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm">{doc.business_name}</h3>
                      <p className="text-xs text-[#63665E] dark:text-[#A5B29A] line-clamp-2">
                        {doc.description}
                      </p>
                      <p className="text-[11px] text-[#8C9287]">
                        {doc.files_count || 1} evidencia(s) adjunta(s) en RustFS/S3
                      </p>
                      {doc.reviewer_notes && (
                        <div
                          className={`p-3 rounded-xl text-xs ${
                            isRejected
                              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                              : "bg-[#F4F1EA] dark:bg-[#18201C] text-[#3B523E] dark:text-[#A5B29A]"
                          }`}
                        >
                          <strong>Dictamen del Administrador:</strong> {doc.reviewer_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBVISTA D: MENSAJES DE TURISTAS */}
        {activeTab === "mensajes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#728C69]" />
                  Conversaciones
                </h2>
                <button
                  type="button"
                  onClick={loadConversations}
                  disabled={loadingConvs}
                  className="text-xs text-[#728C69] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingConvs ? "animate-spin" : ""}`} />
                  Actualizar
                </button>
              </div>

              {convsError && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">
                  {convsError}
                </p>
              )}

              {loadingConvs ? (
                <p className="text-xs text-muted-foreground">Cargando conversaciones...</p>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aún no has recibido mensajes de turistas.
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c: any, idx: number) => {
                    const expId = Number(c.experienceId ?? c.experience_id ?? 0);
                    const otherId = Number(c.otherUserId ?? c.other_user_id ?? c.touristId ?? 0);
                    const preview = c.lastMessage ?? c.last_message ?? c.content ?? "";
                    const isSelected =
                      selectedConv?.experienceId === expId && selectedConv?.otherUserId === otherId;
                    return (
                      <button
                        key={`${expId}-${otherId}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedConv({ experienceId: expId, otherUserId: otherId });
                          loadConversationHistory(expId, otherId);
                        }}
                        className={`w-full text-left p-3 rounded-2xl text-xs transition-colors ${
                          isSelected
                            ? "bg-[#728C69] text-white"
                            : "bg-[#F4F1EA] dark:bg-[#18201C] hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F]"
                        }`}
                      >
                        <div className="font-bold">
                          Turista #{otherId} · Exp #{expId}
                        </div>
                        {preview && (
                          <p className="truncate opacity-80 mt-0.5">{preview}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2 bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[340px]">
              {!selectedConv ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground text-center">
                  Selecciona una conversación para leer el historial y responder al turista.
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-serif text-lg font-bold mb-3">
                      Chat con Turista #{selectedConv.otherUserId} · Experiencia #{selectedConv.experienceId}
                    </h3>
                    <div className="bg-[#F4F1EA] dark:bg-[#18201C] rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2 mb-4">
                      {convMessages.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin mensajes en esta conversación.</p>
                      ) : (
                        convMessages.map((m: any, idx: number) => (
                          <div
                            key={m._id || idx}
                            className="bg-white dark:bg-[#2A312C] rounded-xl p-2.5 text-xs"
                          >
                            <span className="font-bold text-[#728C69] block mb-0.5">
                              {m.senderRole === "PROVIDER" ? "Tú (Cooperativa)" : `Turista #${m.senderId}`}
                            </span>
                            <span>{m.content}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {replyError && (
                    <p className="text-xs text-red-600 mb-2">{replyError}</p>
                  )}

                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu respuesta para el turista..."
                      className="flex-1 bg-[#F4F1EA] dark:bg-[#18201C] rounded-xl px-3 h-10 text-xs"
                    />
                    <button
                      disabled={replySending}
                      type="submit"
                      className="bg-[#C81D77] hover:bg-[#A91864] text-white px-4 rounded-xl text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {replySending ? "Enviando..." : "Responder"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================================
// 2. PANEL DE ADMINISTRADOR (AUDITORÍAS PENDIENTES -> ABRIR ARCHIVO + APROBAR)
// ============================================================================
interface AdminAuditsPortalProps {
  onCatalogUpdated?: () => void;
}

export function AdminAuditsPortal({ onCatalogUpdated }: AdminAuditsPortalProps) {
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [retroalimentacion, setRetroalimentacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAuditorias = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiFetch<any[]>("/api/catalog/audits/pending");
      setAudits(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setLoadError(err.message || "No se pudieron cargar las auditorías pendientes.");
      setAudits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorias();
  }, []);

  const handleOpenEvidenceFile = async (fileId: number) => {
    setOpeningFileId(fileId);
    try {
      const { token } = getUserSession();
      const res = await fetch(`/api/catalog/audits/files/${fileId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("No se pudo abrir el archivo de evidencia");
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleDictamen = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedAudit || isSubmitting) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await apiFetch(`/api/catalog/audits/${selectedAudit.id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({
          decision,
          reviewer_notes:
            retroalimentacion.trim() ||
            (decision === "APPROVED"
              ? "Evidencias ambientales aprobadas y experiencia publicada."
              : "No cumple con los criterios ecológicos de CDMX."),
        }),
      });

      setStatusMessage({
        type: "success",
        text:
          decision === "APPROVED"
            ? `Auditoría #${selectedAudit.id} APROBADA. La actividad ya es visible en el catálogo público.`
            : `Auditoría #${selectedAudit.id} RECHAZADA.`,
      });

      if (onCatalogUpdated) onCatalogUpdated();

      const resolvedId = selectedAudit.id;
      setTimeout(() => {
        setAudits((prev) => prev.filter((a) => a.id !== resolvedId));
        setSelectedAudit(null);
        setRetroalimentacion("");
        setStatusMessage(null);
        setIsSubmitting(false);
      }, 900);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setIsSubmitting(false);
    }
  };

  if (selectedAudit) {
    return (
      <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                setSelectedAudit(null);
                setStatusMessage(null);
              }}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#2A312C] flex items-center justify-center shadow-sm hover:bg-[#E3E5D8]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-serif text-3xl font-bold">Dictamen de Sustentabilidad</h1>
              <p className="text-xs text-[#63665E] dark:text-[#A5B29A]">
                Verificación documental y probatoria ecológica · Expediente #{selectedAudit.id}
              </p>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-4 rounded-xl text-xs mb-6 text-center font-medium ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
              <div className="w-full h-40 bg-[#B4CBB0] rounded-2xl mb-4 relative overflow-hidden">
                <svg viewBox="0 0 400 120" className="w-full h-full object-cover" preserveAspectRatio="none">
                  <circle cx="320" cy="40" r="20" fill="#F4E6B4" />
                  <polygon points="0,120 150,50 350,120" fill="#758C6E" />
                  <polygon points="100,120 280,70 450,120" fill="#586E52" />
                </svg>
                <span className="absolute top-3 right-3 bg-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full text-[#1E201D]">
                  {selectedAudit.status || "PENDING"}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-bold text-[#728C69] uppercase">{selectedAudit.category}</span>
                <span>·</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" /> CDMX
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold mb-2">
                {selectedAudit.business_name}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {selectedAudit.description}
              </p>

              <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <User className="w-3.5 h-3.5 text-[#728C69]" />
                  Proveedor ID: #{selectedAudit.provider_id}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="font-serif text-xl font-bold">
                  Evidencias almacenadas en RustFS / MinIO
                </h3>
                {Array.isArray(selectedAudit.files) && selectedAudit.files.length > 0 ? (
                  selectedAudit.files.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-4 rounded-2xl bg-[#F4F1EA] dark:bg-[#18201C] border border-[#728C69]/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#728C69]/20 text-[#728C69] rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold">{f.file_name}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            Tipo: {f.file_type} · Almacenado en S3/RustFS
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={openingFileId === f.id}
                        onClick={() => handleOpenEvidenceFile(f.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#728C69] hover:bg-[#5B7153] text-white px-3.5 py-2 rounded-xl transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {openingFileId === f.id ? "Abriendo..." : "Abrir archivo"}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F4F1EA] dark:bg-[#18201C] border border-[#728C69]/20 flex items-center gap-3.5">
                    <FileText className="w-5 h-5 text-[#728C69]" />
                    <span className="text-xs">
                      Expediente Ambiental #{selectedAudit.id} adjunto en S3/RustFS.
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
                <h3 className="font-serif text-lg font-bold mb-2">
                  Observaciones y Retroalimentación Técnica
                </h3>
                <textarea
                  value={retroalimentacion}
                  onChange={(e) => setRetroalimentacion(e.target.value)}
                  placeholder="Escribe el dictamen técnico para el proveedor..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#18201C]"
                />
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 w-full bg-[#F4F1EA]/95 dark:bg-[#18201C]/95 backdrop-blur-md p-4 flex gap-4 justify-center border-t border-border shadow-lg z-30">
            <button
              disabled={isSubmitting}
              onClick={() => handleDictamen("REJECTED")}
              className="w-full max-w-xs bg-[#C81D77] hover:bg-[#A91864] text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {isSubmitting ? "Procesando..." : "Rechazar Solicitud"}
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleDictamen("APPROVED")}
              className="w-full max-w-xs bg-[#728C69] hover:bg-[#5B7153] text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Procesando..." : "Aprobar y Publicar"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const categorias = [
    { value: "Todos", label: "Todos" },
    ...CATEGORIAS_CATALOGO,
  ];
  const filtrados = audits.filter((a) =>
    selectedCategory === "Todos"
      ? true
      : a.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif mb-2 font-bold">Auditorías de Actividades y Evidencias</h1>
          <p className="text-sm text-[#63665E] dark:text-[#A5B29A]">
            Revisa las evidencias ambientales adjuntas por los proveedores. Al aprobar una solicitud, su actividad se publica automáticamente en el catálogo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl bg-white dark:bg-[#2A312C] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8C9287] uppercase tracking-wider">
                Expedientes por Auditar
              </span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-serif text-amber-600 mt-2 font-bold">
              {isLoading ? "..." : audits.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#2A312C] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8C9287] uppercase tracking-wider">
                Almacenamiento Verificable
              </span>
              <ShieldAlert className="h-5 w-5 text-[#C81D77]" />
            </div>
            <p className="text-2xl font-serif text-[#C81D77] mt-2 font-bold">RustFS / S3</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#2A312C] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8C9287] uppercase tracking-wider">
                Criterios de Validación
              </span>
              <CheckCircle2 className="h-5 w-5 text-[#728C69]" />
            </div>
            <p className="text-2xl font-serif text-[#728C69] mt-2 font-bold">100% CDMX</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categorias.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.value
                  ? "bg-[#728C69] text-white shadow-sm"
                  : "bg-white dark:bg-[#2A312C] text-[#63665E] dark:text-[#A5B29A]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loadError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300 mb-6">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando auditorías pendientes...</p>
        ) : filtrados.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center bg-white dark:bg-[#2A312C]">
            <ShieldCheck className="w-10 h-10 text-[#728C69] mx-auto mb-2" />
            <p className="text-[#8C9287] text-sm">
              No hay evidencias pendientes en la categoría seleccionada.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((audit) => (
              <div
                key={audit.id}
                className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="w-full h-36 bg-[#B4CBB0] rounded-2xl mb-4 relative overflow-hidden">
                    <svg viewBox="0 0 400 120" className="w-full h-full object-cover" preserveAspectRatio="none">
                      <circle cx="320" cy="40" r="20" fill="#F4E6B4" />
                      <polygon points="0,120 150,50 350,120" fill="#758C6E" />
                      <polygon points="100,120 280,70 450,120" fill="#586E52" />
                    </svg>
                    <span className="absolute top-3 right-3 bg-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full text-[#1E201D]">
                      {audit.files?.length || 1} evidencia(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#728C69] uppercase tracking-wider">
                      {audit.category}
                    </span>
                    <span>·</span>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      Expediente #{audit.id}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold mb-2">{audit.business_name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {audit.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-[#8C9287]">
                    Proveedor #{audit.provider_id}
                  </span>
                  <button
                    onClick={() => setSelectedAudit(audit)}
                    className="inline-flex items-center gap-1.5 bg-[#C81D77] hover:bg-[#A91864] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    Revisar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}