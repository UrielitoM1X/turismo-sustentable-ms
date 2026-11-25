import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  BarChart3,
  CalendarCheck2,
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  Star,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { apiFetch } from "../api/client";
import { RouteView } from "../components/Header";

interface HomePageProps {
  session: { token: string | null; role: string | null; name: string | null };
  onNavigate: (view: RouteView) => void;
}

export default function HomePage({ session, onNavigate }: HomePageProps) {
  const role = session.role?.toUpperCase().trim() || "";
  const isAdmin = role === "ADMIN" || role === "ADMINISTRADOR";
  const isProvider = role === "PROVIDER" || role === "PROVEEDOR";

  const [pendingAudits, setPendingAudits] = useState<any[]>([]);
  const [biKpis, setBiKpis] = useState<any>(null);
  const [experiencesCount, setExperiencesCount] = useState(0);

  useEffect(() => {
    apiFetch<any[]>("/api/catalog/experiences/")
      .then((list) => setExperiencesCount(list.length))
      .catch(() => setExperiencesCount(0));

    if (isAdmin) {
      apiFetch<any[]>("/api/catalog/audits/pending")
        .then(setPendingAudits)
        .catch(() => setPendingAudits([]));
      apiFetch<any>("/api/bi/dashboard/summary")
        .then((res) => setBiKpis(res.kpis))
        .catch(() => setBiKpis(null));
    }
  }, [isAdmin]);

  // ==========================================
  // 1. INICIO DINÁMICO: ROL ADMINISTRADOR
  // ==========================================
  if (session.token && isAdmin) {
    return (
      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm border border-transparent dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C81D77]/10 text-[#C81D77] dark:text-[#E24A96] text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-4 h-4" />
                Panel de Administración General
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201D] dark:text-white">
                Hola, {session.name || "Administrador"}
              </h1>
              <p className="text-sm text-[#8C9287] dark:text-[#9EA399] mt-1 max-w-xl">
                Supervisa el estado de la plataforma sustentable, audita las evidencias contra greenwashing y analiza el impacto en la CDMX.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("admin-auditorias")}
                className="px-5 py-2.5 rounded-full bg-[#C81D77] hover:bg-[#a61763] text-white text-xs font-medium transition-all shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Auditar Evidencias ({pendingAudits.length})
              </button>
              <button
                onClick={() => onNavigate("admin-bi")}
                className="px-5 py-2.5 rounded-full bg-[#728C69] hover:bg-[#5b7353] text-white text-xs font-medium transition-all shadow-sm flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Métricas BI
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas en Tiempo Real */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">Por Auditar</span>
                <Clock className="w-4 h-4 text-[#C81D77]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#C81D77]">
                {pendingAudits.length}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">Evidencias pendientes</p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">Experiencias</span>
                <Building2 className="w-4 h-4 text-[#728C69]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                {experiencesCount}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">Activas en PostGIS</p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">Reservaciones</span>
                <CalendarCheck2 className="w-4 h-4 text-[#728C69]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                {biKpis?.total_bookings ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">Registradas vía RabbitMQ</p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">Fondo Ecológico</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                ${biKpis?.total_impact_fund ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">MXN recaudados</p>
            </div>
          </div>

          {/* Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => onNavigate("admin-auditorias")}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#C81D77]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#C81D77]/10 flex items-center justify-center text-[#C81D77] mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#C81D77] transition-colors">
                  Auditoría de Evidencias
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  Revisa documentos ecológicos almacenados en RustFS y aprueba o rechaza solicitudes.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#C81D77]">
                <span>Ir a auditorías</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => onNavigate("admin-bi")}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#728C69]/10 flex items-center justify-center text-[#728C69] mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  Panel BI y Analítica
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  Visualiza ingresos, fondo ecológico y turistas movilizados en tiempo real.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>Ver analítica</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => onNavigate("busqueda")}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E3E5D8] dark:bg-[#3D453F] flex items-center justify-center mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  Catálogo Verificado
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  Supervisa las experiencias ecoturísticas activas en la Ciudad de México.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>Explorar catálogo</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // 2. INICIO DINÁMICO: ROL PROVEEDOR
  // ==========================================
  if (session.token && isProvider) {
    return (
      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#728C69]/15 text-[#728C69] dark:text-[#A5B29A] text-xs font-bold uppercase tracking-wider mb-3">
                <Building2 className="w-4 h-4" />
                Panel de Negocio Sustentable
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201D] dark:text-white">
                {session.name || "Mi Cooperativa"}
              </h1>
              <p className="text-sm text-[#8C9287] mt-1 max-w-xl">
                Gestiona tus evidencias sustentables, publica experiencias con capacidad de carga controlada y mantén activo tu sello.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                Cuenta de Proveedor Activa
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate("negocio-dashboard")}
                  className="px-4 py-2 rounded-full bg-[#728C69] hover:bg-[#5b7353] text-white text-xs font-medium transition-all shadow-sm"
                >
                  Publicar Experiencia
                </button>
                <button
                  onClick={() => onNavigate("negocio-documentos")}
                  className="px-4 py-2 rounded-full bg-white dark:bg-[#3D453F] border border-gray-200 dark:border-white/10 hover:border-[#728C69] text-xs font-medium transition-all"
                >
                  Subir Evidencias
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onNavigate("negocio-documentos")}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#728C69]/10 flex items-center justify-center text-[#728C69] mb-4">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  Documentos y Evidencias Ambientales
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  Sube constancias ecológicas (PDF/JPG) hacia RustFS/MinIO para validación contra greenwashing.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>Subir documentos</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => onNavigate("negocio-dashboard")}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#728C69]/10 flex items-center justify-center text-[#728C69] mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  Publicar Nueva Experiencia Ecoturística
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  Define alcaldía, precio, cupo máximo ecológico y prácticas sustentables en el catálogo PostGIS.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>Crear experiencia</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // 3. INICIO TURISTA / PÚBLICO GENERAL (ÓRBITA)
  // ==========================================
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground transition-colors duration-300 isolate">
      {session.token && (
        <div className="absolute top-4 z-20 px-4 py-1.5 rounded-full bg-[#728C69]/15 border border-[#728C69]/30 text-xs font-medium text-[#728C69] dark:text-[#A5B29A] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            Bienvenido, {session.name || "viajero"} · Explora experiencias auténticas en CDMX
          </span>
        </div>
      )}

      {/* Círculo superior izquierdo */}
      <div className="absolute w-[40rem] h-[40rem] -left-[12.5rem] -top-[16.25rem] rounded-full bg-blob-top z-0 transition-colors duration-300" />

      {/* Círculo inferior derecho */}
      <div className="absolute w-[26.25rem] h-[26.25rem] -right-[10rem] bottom-[3.75rem] rounded-full bg-blob-bottom z-0 transition-colors duration-300" />

      {/* Montañas SVG */}
      <div className="absolute bottom-0 left-0 w-full h-[140px] z-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-[140px] text-[#8F9F7E] dark:brightness-75 transition-colors duration-300"
        >
          <path
            fill="currentColor"
            d="M0 140V76L288 20L604.8 80L950 25L1250 70L1440 35V140Z"
          />
        </svg>

        <svg
          viewBox="0 0 1440 76"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-[76px] text-[#5A7050] dark:brightness-75 transition-colors duration-300"
        >
          <path
            fill="currentColor"
            d="M0 76V44L316.8 4L662.4 48L1050 10L1320 50L1440 25V76Z"
          />
        </svg>
      </div>

      {/* Contenido Central */}
      <div className="relative z-10 flex w-full max-w-[1200px] flex-col md:flex-row items-center justify-between px-8 py-12 gap-8">
        {/* Texto Izquierdo */}
        <div className="w-[15.625rem] space-y-2 text-center md:text-left">
          <p className="text-[0.6875rem] font-bold tracking-[0.1875rem] text-primary uppercase">
            01 · CONECTA
          </p>
          <p className="text-[0.875rem] leading-[1.3125rem] text-muted-foreground">
            Turistas y cooperativas locales en un solo lugar.
          </p>
        </div>

        {/* Órbita Central Animada */}
        <div className="relative flex h-[340px] w-[340px] sm:h-[480px] sm:w-[480px] flex-col items-center justify-center">
          <div className="absolute h-full w-full animate-[spin_40s_linear_infinite]">
            <div className="absolute h-full w-full rounded-full border border-dashed border-[#B0B0B0] dark:border-gray-700 transition-colors duration-300" />

            <div className="absolute left-[12%] top-[18%] -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-md [animation:reverse-spin_40s_linear_infinite]">
                <img src="/hoja_oscura.svg" alt="Hoja" className="w-6 h-6" />
              </div>
            </div>

            <div className="absolute bottom-[28%] left-[2%] -translate-x-1/2 translate-y-1/2 z-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2E0D5] shadow-md [animation:reverse-spin_40s_linear_infinite]">
                <img src="/hoja.svg" alt="Hoja" className="w-6 h-6" />
              </div>
            </div>

            <div className="absolute bottom-[22%] right-[10%] translate-x-1/2 translate-y-1/2 z-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#708B63] shadow-md [animation:reverse-spin_40s_linear_infinite]">
                <img src="/hoja_oscura.svg" alt="Hoja" className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="relative h-[250px] w-[250px] sm:h-[360px] sm:w-[360px] rounded-full border-[1.5px] border-[#708B63] bg-card shadow-sm z-10 flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
            <img src="/hoja.svg" alt="EcoCDMX" className="w-10 h-10 mb-3" />
            <span className="font-serif text-2xl sm:text-3xl text-[#1E201D] dark:text-white">
              EcoCDMX
            </span>
            <span className="text-xs text-muted-foreground mt-2 max-w-[200px]">
              Experiencias regenerativas verificadas en la Ciudad de México
            </span>
          </div>
        </div>

        {/* Texto Derecho */}
        <div className="w-[15.625rem] space-y-2 text-center md:text-right">
          <p className="text-[0.6875rem] font-bold tracking-[0.1875rem] text-primary uppercase">
            02 · VALIDA
          </p>
          <p className="text-[0.875rem] leading-[1.3125rem] text-muted-foreground">
            Reseñas y fotos reales contra el greenwashing.
          </p>
        </div>
      </div>

      {/* Texto Inferior y Botones */}
      <div className="relative z-10 -mt-6 mb-10 flex flex-col items-center space-y-5 px-4 text-center">
        <h1 className="text-xs sm:text-sm font-medium tracking-[0.35em] text-[#708B63]">
          TURISMO SUSTENTABLE · CIUDAD DE MÉXICO
        </h1>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate("busqueda")}
            className="group flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 shadow-md"
          >
            Comenzar exploración
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <button
            onClick={() => onNavigate("about")}
            className="flex items-center justify-center gap-2 rounded-full bg-white dark:bg-[#2A312C] border border-gray-200 dark:border-white/10 px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-[#728C69] shadow-sm"
          >
            Acerca de nosotros
          </button>
        </div>
      </div>
    </main>
  );
}