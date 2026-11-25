import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { apiFetch } from "../api/client";

const ALCALDIAS_CDMX = [
  "Xochimilco",
  "Tlalpan",
  "Milpa Alta",
  "Magdalena Contreras",
  "Cuajimalpa",
  "Coyoacán",
  "Álvaro Obregón",
  "Tláhuac",
  "Iztapalapa",
  "Gustavo A. Madero",
  "Miguel Hidalgo",
  "Cuauhtémoc",
];

// ============================================================================
// 1. PANEL COMPLETO DE PROVEEDOR (MI CUENTA + DOCUMENTOS + NUEVA EXPERIENCIA)
// ============================================================================
interface ProviderPortalProps {
  session: { token: string | null; role: string | null; name: string | null };
  initialTab?: "cuenta" | "resumen" | "evidencias" | "nuevaExp";
  onCatalogUpdated: () => void;
  onNavigateReservas: () => void;
}

export function ProviderPortal({
  session,
  initialTab = "cuenta",
  onCatalogUpdated,
  onNavigateReservas,
}: ProviderPortalProps) {
  const [activeTab, setActiveTab] = useState<"cuenta" | "resumen" | "evidencias" | "nuevaExp">(initialTab);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAudits, setSubmittedAudits] = useState<any[]>([]);

  // Form Subir Evidencia -> POST /api/catalog/audits/submit
  const [businessName, setBusinessName] = useState(session.name || "Cooperativa Sustentable CDMX");
  const [evidenciaCategoria, setEvidenciaCategoria] = useState("Naturaleza");
  const [evidenciaDesc, setEvidenciaDesc] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  // Form Crear Experiencia -> POST /api/catalog/experiences/
  const [expTitulo, setExpTitulo] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expCategoria, setExpCategoria] = useState("Naturaleza");
  const [expAlcaldia, setExpAlcaldia] = useState("Xochimilco");
  const [expPrecio, setExpPrecio] = useState(650);
  const [expDuracion, setExpDuracion] = useState(180);
  const [expCapacidad, setExpCapacidad] = useState(8);
  const [expPracticas, setExpPracticas] = useState(
    "Cero plásticos de un solo uso, energía solar y conservación de suelo."
  );
  const [petFriendly, setPetFriendly] = useState(true);
  const [accessible, setAccessible] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSubirEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const fd = new FormData();
      fd.append("business_name", businessName.trim());
      fd.append("category", evidenciaCategoria);
      fd.append(
        "description",
        evidenciaDesc.trim() || "Certificación ambiental y plan de manejo de residuos."
      );

      if (files && files.length > 0) {
        Array.from(files).forEach((f) => fd.append("files", f));
      } else {
        fd.append(
          "files",
          new File(["%PDF-1.4 evidencia"], "Certificacion_Ambiental.pdf", {
            type: "application/pdf",
          })
        );
      }

      const res = await apiFetch<any>("/api/catalog/audits/submit", {
        method: "POST",
        body: fd,
      });

      setSubmittedAudits((prev) => [
        {
          id: res.audit_id,
          business_name: businessName,
          category: evidenciaCategoria,
          description: evidenciaDesc,
          status: "PENDING",
        },
        ...prev,
      ]);

      setFeedback({
        type: "success",
        text: `Evidencia ecológica subida a RustFS/MinIO (Auditoría ID #${res.audit_id}). Esperando dictamen del administrador.`,
      });
      setEvidenciaDesc("");
      setFiles(null);
      setActiveTab("resumen");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCrearExperiencia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await apiFetch("/api/catalog/experiences/", {
        method: "POST",
        body: JSON.stringify({
          title: expTitulo.trim(),
          description: expDesc.trim(),
          category: expCategoria,
          borough_cdmx: expAlcaldia,
          latitude: 19.2647,
          longitude: -99.1036,
          price: Number(expPrecio),
          duration_minutes: Number(expDuracion),
          max_capacity: Number(expCapacidad),
          pet_friendly: petFriendly,
          accessible,
          sustainable_practices: expPracticas.trim(),
        }),
      });

      setFeedback({
        type: "success",
        text: "¡Experiencia sustentable creada y publicada en el catálogo PostGIS!",
      });
      setExpTitulo("");
      setExpDesc("");
      onCatalogUpdated();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: `${err.message} (Recuerda que un administrador debe aprobar primero tu auditoría).`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navegación interna de Proveedor */}
        <div className="flex flex-wrap bg-[#E3E5D8] dark:bg-[#2A312C] p-1 rounded-xl mb-8 max-w-xl">
          {[
            { id: "cuenta", label: "Mi Cuenta" },
            { id: "resumen", label: `Evidencias (${submittedAudits.length})` },
            { id: "evidencias", label: "+ Subir Evidencia" },
            { id: "nuevaExp", label: "+ Nueva Actividad" },
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
            className={`p-4 rounded-xl text-xs mb-6 text-center ${
              feedback.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* SUBVISTA A: MI CUENTA (DISEÑO TARJETA CON MONTAÑAS SVG) */}
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
                <span className="uppercase">{evidenciaCategoria}</span>
                <span>·</span>
                <span>{expAlcaldia}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setActiveTab("evidencias")}
                className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
              >
                <span className="text-base font-medium">Documentos y Evidencias</span>
                <ArrowRight className="w-4 h-4 text-[#8C9287]" />
              </button>

              <button
                onClick={() => setActiveTab("nuevaExp")}
                className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
              >
                <span className="text-base font-medium">Publicar Actividad Sustentable</span>
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

        {/* SUBVISTA B: RESUMEN DE EVIDENCIAS */}
        {activeTab === "resumen" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 mb-6 border bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-start gap-3.5">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold">Validación contra Greenwashing</h3>
                <p className="text-xs mt-1 leading-relaxed">
                  Para proteger los ecosistemas de la CDMX, sube tus certificados o planes de manejo ambiental. Una vez aprobados por un administrador podrás publicar experiencias en el catálogo.
                </p>
              </div>
            </div>

            {submittedAudits.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#2A312C] rounded-2xl border border-dashed border-[#8C9287]/40">
                <UploadCloud className="h-10 w-10 text-[#728C69] mx-auto mb-2" />
                <p className="text-sm text-[#8C9287] mb-3">
                  Sube tus evidencias ambientales hacia el almacenamiento S3/RustFS.
                </p>
                <button
                  onClick={() => setActiveTab("evidencias")}
                  className="text-xs bg-[#728C69] text-white px-4 py-2 rounded-xl font-medium"
                >
                  Subir mi primer certificado
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {submittedAudits.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-[#2A312C] rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-[#728C69] uppercase tracking-wider">
                        Auditoría #{doc.id} · {doc.category}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        PENDIENTE DE REVISIÓN
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm">{doc.business_name}</h3>
                    <p className="text-xs text-[#63665E] dark:text-[#A5B29A] mt-1">
                      {doc.description || "Expediente ambiental enviado."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBVISTA C: SUBIR EVIDENCIA A RUSTFS/MINIO */}
        {activeTab === "evidencias" && (
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
            <h2 className="text-2xl font-serif mb-4 font-bold">
              Registrar Nueva Evidencia Ecológica
            </h2>
            <form onSubmit={handleSubirEvidencia} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Nombre del Negocio / Cooperativa</label>
                <input
                  required
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Categoría Ecológica</label>
                <select
                  value={evidenciaCategoria}
                  onChange={(e) => setEvidenciaCategoria(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                >
                  <option value="Naturaleza">Naturaleza</option>
                  <option value="Ecoturismo">Ecoturismo</option>
                  <option value="Cultura">Cultura</option>
                  <option value="Gastronomía">Gastronomía</option>
                  <option value="Relax">Relax</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Descripción o Alcance</label>
                <textarea
                  required
                  value={evidenciaDesc}
                  onChange={(e) => setEvidenciaDesc(e.target.value)}
                  placeholder="Detalles sobre prácticas ambientales demostradas (compostaje, cero plásticos, energía solar)..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">
                  Archivos Probatorios (PDF, JPG, PNG)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#728C69] hover:bg-[#5B7153] text-white py-3.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Subiendo a RustFS..." : "Enviar a Auditoría"}
              </button>
            </form>
          </div>
        )}

        {/* SUBVISTA D: NUEVA ACTIVIDAD EN POSTGIS */}
        {activeTab === "nuevaExp" && (
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
            <h2 className="text-2xl font-serif mb-4 font-bold">
              Dar de Alta Experiencia Sustentable
            </h2>
            <form onSubmit={handleCrearExperiencia} className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Título de la Actividad</label>
                <input
                  required
                  type="text"
                  value={expTitulo}
                  onChange={(e) => setExpTitulo(e.target.value)}
                  placeholder="ej. Amanecer en Chinampa Agroecológica"
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <div>
                <label className="text-xs font-medium block mb-1">Descripción Detallada</label>
                <textarea
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Explica el recorrido y su aporte ambiental..."
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
                    <option value="Naturaleza">Naturaleza</option>
                    <option value="Cultura">Cultura</option>
                    <option value="Relax">Relax</option>
                    <option value="Gastronomía">Gastronomía</option>
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
                    type="number"
                    min={15}
                    value={expDuracion}
                    onChange={(e) => setExpDuracion(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">Capacidad Máx</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
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
                <label className="text-xs font-medium block mb-1">Prácticas Sustentables</label>
                <input
                  type="text"
                  value={expPracticas}
                  onChange={(e) => setExpPracticas(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C81D77] hover:bg-[#A91864] text-white py-3.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Publicando..." : "Publicar Experiencia en el Catálogo"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================================
// 2. PANEL COMPLETO DE ADMINISTRADOR (LISTADO + DETALLE DE DICTAMEN)
// ============================================================================
export function AdminAuditsPortal() {
  const [audits, setAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);
  const [retroalimentacion, setRetroalimentacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAuditorias = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any[]>("/api/catalog/audits/pending");
      setAudits(Array.isArray(data) ? data : []);
    } catch {
      setAudits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditorias();
  }, []);

  const handleDictamen = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedAudit) return;
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
              ? "Documentación ambiental aprobada."
              : "No cumple con los criterios ecológicos de CDMX."),
        }),
      });

      setStatusMessage({
        type: "success",
        text: `Auditoría #${selectedAudit.id} dictaminada como ${decision}.`,
      });

      setTimeout(() => {
        setAudits((prev) => prev.filter((a) => a.id !== selectedAudit.id));
        setSelectedAudit(null);
        setRetroalimentacion("");
        setStatusMessage(null);
      }, 900);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // VISTA DETALLE DE DICTAMEN (EQUIVALENTE A /admin/auditorias/[id])
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
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
                <h3 className="font-serif text-xl font-bold mb-4">
                  Evidencias almacenadas en RustFS / MinIO
                </h3>
                <div className="p-5 rounded-2xl bg-[#F4F1EA] dark:bg-[#18201C] border border-[#728C69]/20 flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-[#728C69]/20 text-[#728C69] rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#728C69] uppercase">
                      Expediente Ambiental #{selectedAudit.id}
                    </span>
                    <h4 className="text-sm font-bold">{selectedAudit.business_name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedAudit.evidence_urls?.length
                        ? `${selectedAudit.evidence_urls.length} archivo(s) verificables adjuntos en bucket S3.`
                        : "Documentación verificable adjunta en bucket S3."}
                    </p>
                  </div>
                </div>
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

          {/* Botones Flotantes Inferiores */}
          <div className="fixed bottom-0 left-0 w-full bg-[#F4F1EA]/95 dark:bg-[#18201C]/95 backdrop-blur-md p-4 flex gap-4 justify-center border-t border-border shadow-lg z-30">
            <button
              disabled={isSubmitting}
              onClick={() => handleDictamen("REJECTED")}
              className="w-full max-w-xs bg-[#C81D77] hover:bg-[#A91864] text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {isSubmitting ? "Procesando..." : "Rechazar Evidencias"}
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleDictamen("APPROVED")}
              className="w-full max-w-xs bg-[#728C69] hover:bg-[#5B7153] text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Procesando..." : "Aprobar Proveedor"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const categorias = ["Todos", "Naturaleza", "Cultura", "Gastronomía", "Relax", "Ecoturismo"];
  const filtrados = audits.filter((a) =>
    selectedCategory === "Todos"
      ? true
      : a.category?.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif mb-2 font-bold">Evidencias de Proveedores</h1>
          <p className="text-sm text-[#63665E] dark:text-[#A5B29A]">
            Revisa y dictamina las certificaciones ecológicas presentadas por los negocios en la CDMX.
          </p>
        </div>

        {/* Métricas Rápidas */}
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

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-[#728C69] text-white shadow-sm"
                  : "bg-white dark:bg-[#2A312C] text-[#63665E] dark:text-[#A5B29A]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

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
                      CDMX
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