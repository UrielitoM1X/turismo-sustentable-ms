import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  FileText,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import { useHomeDashboard } from "../hooks/useHomeDashboard";

export default function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { session, isAdmin, isProvider } = useAuth();
  const { pendingAudits, biKpis, experiencesCount, providerBi, providerExps } =
    useHomeDashboard();

  if (session.token && isAdmin) {
    return (
      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm border border-transparent dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C81D77]/10 text-[#C81D77] dark:text-[#E24A96] text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-4 h-4" />
                {t("home.admin.badge")}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201D] dark:text-white">
                {t("home.admin.greeting", {
                  name: session.name || t("home.admin.defaultName"),
                })}
              </h1>
              <p className="text-sm text-[#8C9287] dark:text-[#9EA399] mt-1 max-w-xl">
                {t("home.admin.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(ROUTES.ADMIN_AUDITS)}
                className="px-5 py-2.5 rounded-full bg-[#C81D77] hover:bg-[#a61763] text-white text-xs font-medium transition-all shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t("home.admin.btnAudits", { count: pendingAudits.length })}
              </button>
              <button
                onClick={() => navigate(ROUTES.ADMIN_BI)}
                className="px-5 py-2.5 rounded-full bg-[#728C69] hover:bg-[#5b7353] text-white text-xs font-medium transition-all shadow-sm flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {t("home.admin.btnBi")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.admin.kpiPending")}</span>
                <Clock className="w-4 h-4 text-[#C81D77]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#C81D77]">
                {pendingAudits.length}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">{t("home.admin.kpiPendingSub")}</p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.admin.kpiExperiences")}</span>
                <Building2 className="w-4 h-4 text-[#728C69]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                {experiencesCount}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">
                {t("home.admin.kpiExperiencesSub")}
              </p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.admin.kpiBookings")}</span>
                <CalendarCheck2 className="w-4 h-4 text-[#728C69]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                {biKpis?.total_bookings ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">{t("home.admin.kpiBookingsSub")}</p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.admin.kpiFund")}</span>
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                ${biKpis?.total_impact_fund ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">{t("home.admin.kpiFundSub")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate(ROUTES.ADMIN_AUDITS)}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#C81D77]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#C81D77]/10 flex items-center justify-center text-[#C81D77] mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#C81D77] transition-colors">
                  {t("home.admin.cardAuditsTitle")}
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  {t("home.admin.cardAuditsDesc")}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#C81D77]">
                <span>{t("home.admin.cardAuditsCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => navigate(ROUTES.ADMIN_BI)}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#728C69]/10 flex items-center justify-center text-[#728C69] mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  {t("home.admin.cardBiTitle")}
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  {t("home.admin.cardBiDesc")}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>{t("home.admin.cardBiCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => navigate(ROUTES.EXPLORE)}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E3E5D8] dark:bg-[#3D453F] flex items-center justify-center mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  {t("home.admin.cardCatalogTitle")}
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  {t("home.admin.cardCatalogDesc")}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>{t("home.admin.cardCatalogCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (session.token && isProvider) {
    const activeCount = providerExps.filter((e) => e.is_active).length;
    const pendingCount = providerExps.length - activeCount;

    return (
      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#728C69]/15 text-[#728C69] dark:text-[#A5B29A] text-xs font-bold uppercase tracking-wider mb-3">
                <Building2 className="w-4 h-4" />
                {t("home.provider.badge")}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1E201D] dark:text-white">
                {session.name || t("home.provider.defaultName")}
              </h1>
              <p className="text-sm text-[#8C9287] mt-1 max-w-xl">
                {t("home.provider.subtitle")}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                {t("home.provider.activeBadge")}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(ROUTES.PROVIDER_MONITORING)}
                  className="px-4 py-2 rounded-full bg-[#C81D77] hover:bg-[#a61763] text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  {t("home.provider.btnMonitoring")}
                </button>
                <button
                  onClick={() => navigate(ROUTES.PROVIDER_NEW)}
                  className="px-4 py-2 rounded-full bg-[#728C69] hover:bg-[#5b7353] text-white text-xs font-medium transition-all shadow-sm"
                >
                  {t("home.provider.btnPublish")}
                </button>
                <button
                  onClick={() => navigate(ROUTES.PROVIDER_DOCUMENTS)}
                  className="px-4 py-2 rounded-full bg-white dark:bg-[#3D453F] border border-gray-200 dark:border-white/10 hover:border-[#728C69] text-xs font-medium transition-all"
                >
                  {t("home.provider.btnEvidence")}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.provider.kpiServices")}</span>
                <Building2 className="w-4 h-4 text-[#728C69]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                {providerExps.length}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">
                {t("home.provider.kpiServicesSub", {
                  active: activeCount,
                  pending: pendingCount,
                })}
              </p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.provider.kpiBookings")}</span>
                <CalendarCheck2 className="w-4 h-4 text-[#C81D77]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#1E201D] dark:text-white">
                {providerBi?.kpis.total_bookings ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">
                {t("home.provider.kpiBookingsSub")}
              </p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.provider.kpiRevenue")}</span>
                <DollarSign className="w-4 h-4 text-[#728C69]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#3B523E] dark:text-[#A5B29A]">
                ${providerBi?.kpis.total_revenue ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">
                {t("home.provider.kpiRevenueSub")}
              </p>
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8C9287] mb-2">
                <span className="text-xs font-medium">{t("home.provider.kpiTourists")}</span>
                <Users className="w-4 h-4 text-[#C81D77]" />
              </div>
              <p className="font-serif text-3xl font-bold text-[#C81D77]">
                {providerBi?.kpis.total_tourists ?? 0}
              </p>
              <p className="text-[11px] text-[#8C9287] mt-1">
                {t("home.provider.kpiTouristsSub")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate(ROUTES.PROVIDER_MONITORING)}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#C81D77]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#C81D77]/10 flex items-center justify-center text-[#C81D77] mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#C81D77] transition-colors">
                  {t("home.provider.cardMonTitle")}
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  {t("home.provider.cardMonDesc")}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#C81D77]">
                <span>{t("home.provider.cardMonCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => navigate(ROUTES.PROVIDER_DOCUMENTS)}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#728C69]/10 flex items-center justify-center text-[#728C69] mb-4">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  {t("home.provider.cardDocsTitle")}
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  {t("home.provider.cardDocsDesc")}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>{t("home.provider.cardDocsCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => navigate(ROUTES.PROVIDER_NEW)}
              className="text-left group bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm hover:border-[#728C69]/30 border border-transparent transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#728C69]/10 flex items-center justify-center text-[#728C69] mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg group-hover:text-[#728C69] transition-colors">
                  {t("home.provider.cardNewTitle")}
                </h3>
                <p className="text-xs text-[#8C9287] mt-2 leading-relaxed">
                  {t("home.provider.cardNewDesc")}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#728C69]">
                <span>{t("home.provider.cardNewCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground transition-colors duration-300 isolate">
      {session.token && (
        <div className="absolute top-4 z-20 px-4 py-1.5 rounded-full bg-[#728C69]/15 border border-[#728C69]/30 text-xs font-medium text-[#728C69] dark:text-[#A5B29A] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {t("home.tourist.welcome", {
              name: session.name || t("home.tourist.defaultName"),
            })}
          </span>
        </div>
      )}

      <div className="absolute w-[40rem] h-[40rem] -left-[12.5rem] -top-[16.25rem] rounded-full bg-blob-top z-0 transition-colors duration-300" />
      <div className="absolute w-[26.25rem] h-[26.25rem] -right-[10rem] bottom-[3.75rem] rounded-full bg-blob-bottom z-0 transition-colors duration-300" />

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

      <div className="relative z-10 flex w-full max-w-[1200px] flex-col md:flex-row items-center justify-between px-8 py-12 gap-8">
        <div className="w-[15.625rem] space-y-2 text-center md:text-left">
          <p className="text-[0.6875rem] font-bold tracking-[0.1875rem] text-primary uppercase">
            {t("home.public.step1Title")}
          </p>
          <p className="text-[0.875rem] leading-[1.3125rem] text-muted-foreground">
            {t("home.public.step1Desc")}
          </p>
        </div>

        <div className="relative flex h-[340px] w-[340px] sm:h-[480px] sm:w-[480px] flex-col items-center justify-center">
          <div className="absolute h-full w-full animate-[spin_40s_linear_infinite]">
            <div className="absolute h-full w-full rounded-full border border-dashed border-[#B0B0B0] dark:border-gray-700 transition-colors duration-300" />

            <div className="absolute left-[12%] top-[18%] -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-md [animation:reverse-spin_40s_linear_infinite]">
                <img src="/hoja_oscura.svg" alt="Leaf" className="w-6 h-6" />
              </div>
            </div>

            <div className="absolute bottom-[28%] left-[2%] -translate-x-1/2 translate-y-1/2 z-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E2E0D5] shadow-md [animation:reverse-spin_40s_linear_infinite]">
                <img src="/hoja.svg" alt="Leaf" className="w-6 h-6" />
              </div>
            </div>

            <div className="absolute bottom-[22%] right-[10%] translate-x-1/2 translate-y-1/2 z-20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#708B63] shadow-md [animation:reverse-spin_40s_linear_infinite]">
                <img src="/hoja_oscura.svg" alt="Leaf" className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="relative h-[250px] w-[250px] sm:h-[360px] sm:w-[360px] rounded-full border-[1.5px] border-[#708B63] bg-card shadow-sm z-10 flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
            <img src="/hoja.svg" alt="EcoCDMX" className="w-10 h-10 mb-3" />
            <span className="font-serif text-2xl sm:text-3xl text-[#1E201D] dark:text-white">
              {t("home.public.orbitTitle")}
            </span>
            <span className="text-xs text-muted-foreground mt-2 max-w-[200px]">
              {t("home.public.orbitSubtitle")}
            </span>
          </div>
        </div>

        <div className="w-[15.625rem] space-y-2 text-center md:text-right">
          <p className="text-[0.6875rem] font-bold tracking-[0.1875rem] text-primary uppercase">
            {t("home.public.step2Title")}
          </p>
          <p className="text-[0.875rem] leading-[1.3125rem] text-muted-foreground">
            {t("home.public.step2Desc")}
          </p>
        </div>
      </div>

      <div className="relative z-10 -mt-6 mb-10 flex flex-col items-center space-y-5 px-4 text-center">
        <h1 className="text-xs sm:text-sm font-medium tracking-[0.35em] text-[#708B63]">
          {t("home.public.tagline")}
        </h1>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate(ROUTES.EXPLORE)}
            className="group flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 shadow-md"
          >
            {t("home.public.ctaExplore")}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.ABOUT)}
            className="flex items-center justify-center gap-2 rounded-full bg-white dark:bg-[#2A312C] border border-gray-200 dark:border-white/10 px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-[#728C69] shadow-sm"
          >
            {t("home.public.ctaAbout")}
          </button>
        </div>
      </div>
    </main>
  );
}
