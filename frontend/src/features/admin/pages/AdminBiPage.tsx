import React from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck2,
  DollarSign,
  Leaf,
  MapPin,
  RefreshCw,
  Server,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import TrendLineChart, { TrendMetricKey } from "../../../components/TrendLineChart";
import { useCatalog } from "../../../context/CatalogContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAdminBi } from "../hooks/useAdminBi";

const DONUT_COLORS = ["#728C69", "#C81D77", "#D98A5F", "#3B523E", "#6B7F99"];

export default function AdminBiPage() {
  const { lang, t, formatCategory } = useLanguage();
  const { experiences } = useCatalog();
  const { biData, biError, loading, lastUpdated, trendMetric, setTrendMetric, loadBi } =
    useAdminBi();

  const categoryBreakdown = experiences.reduce<Record<string, number>>((acc, item) => {
    const key = item.category || "General";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const metricConfig: Record<
    TrendMetricKey,
    { label: string; color: string; format: (v: number) => string }
  > = {
    revenue: {
      label: t("bi.metricRevenue"),
      color: "#3B523E",
      format: (v) => `$${v.toFixed(2)} MXN`,
    },
    bookings_count: {
      label: t("bi.metricBookings"),
      color: "#C81D77",
      format: (v) => `${v} ${t("bi.metricBookings").toLowerCase()}`,
    },
    tourists: {
      label: t("bi.metricTourists"),
      color: "#728C69",
      format: (v) => `${v} ${t("bi.metricTourists").toLowerCase()}`,
    },
    impact_fund: {
      label: t("bi.metricImpact"),
      color: "#D98A5F",
      format: (v) => `$${v.toFixed(2)} MXN`,
    },
  };

  if (biError) {
    return (
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-sm text-amber-700 dark:text-amber-300">
          {t("bi.restricted", { error: biError })}
        </div>
      </main>
    );
  }

  if (loading && !biData) {
    return (
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        <p className="text-sm text-muted-foreground">{t("bi.loading")}</p>
      </main>
    );
  }

  if (!biData?.kpis) return null;

  const kpis = biData.kpis;
  const overview = biData.platform_overview;
  const byCategory = Array.isArray(biData.by_category) ? biData.by_category : [];
  const totalCatBookings = byCategory.reduce((s, c) => s + Number(c.bookings_count || 0), 0);

  const donutRadius = 52;
  const donutCirc = 2 * Math.PI * donutRadius;
  let accumulatedDash = 0;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl mb-1">{t("bi.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("bi.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {t("bi.lastUpdated", { time: lastUpdated })}
            </span>
          )}
          <button
            type="button"
            onClick={loadBi}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-[#2A312C] border border-gray-200 dark:border-white/10 hover:border-[#728C69] px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiBookings")}</span>
            <CalendarCheck2 className="w-4 h-4 text-[#C81D77]" />
          </div>
          <p className="font-serif text-4xl font-bold mt-2">{kpis.total_bookings}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiBookingsSub", { exps: kpis.active_experiences_booked ?? 0 })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiRevenue")}</span>
            <DollarSign className="w-4 h-4 text-[#3B523E] dark:text-[#A5B29A]" />
          </div>
          <p className="font-serif text-4xl font-bold text-[#3B523E] dark:text-[#A5B29A] mt-2">
            ${Number(kpis.total_revenue).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiRevenueSub", { avg: Number(kpis.avg_ticket ?? 0).toFixed(2) })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiImpact")}</span>
            <Leaf className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-4xl font-bold text-[#728C69] mt-2">
            ${Number(kpis.total_impact_fund).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiImpactSub", { avg: Number(kpis.avg_impact_per_tourist ?? 0).toFixed(2) })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiTourists")}</span>
            <Users className="w-4 h-4 text-[#C81D77]" />
          </div>
          <p className="font-serif text-4xl font-bold text-[#C81D77] mt-2">
            {kpis.total_tourists_mobilized}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiTouristsSub", { avg: Number(kpis.avg_group_size ?? 0).toFixed(1) })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiUniqueTourists")}</span>
            <TrendingUp className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">{kpis.unique_tourists ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiUniqueSub", { rate: kpis.repeat_tourist_rate ?? 0 })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiCatalog")}</span>
            <Building2 className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">
            {overview?.total_active_experiences ?? experiences.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiCatalogSub", {
              providers:
                overview?.total_catalog_providers ?? kpis.active_providers_with_bookings ?? 0,
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiInclusion")}</span>
            <ShieldCheck className="w-4 h-4 text-[#C81D77]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">
            {overview ? `${overview.pet_friendly_pct}%` : "0%"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiInclusionSub", {
              pet: overview?.pet_friendly_pct ?? 0,
              acc: overview?.accessible_pct ?? 0,
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("bi.kpiCapacity")}</span>
            <Activity className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">
            {overview?.total_ecological_capacity ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("bi.kpiCapacitySub", { price: Number(overview?.avg_catalog_price ?? 0).toFixed(2) })}
          </p>
        </div>
      </div>

      {Array.isArray(biData.daily_trend) && biData.daily_trend.length > 0 && (
        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#728C69]" />
                <h2 className="font-serif text-xl">{t("bi.trendTitle")}</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("bi.trendSubtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-[#F2EFE9] dark:bg-[#18201C] p-1 rounded-xl">
              {(Object.keys(metricConfig) as TrendMetricKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTrendMetric(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    trendMetric === key
                      ? "bg-white dark:bg-[#3D453F] text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {metricConfig[key].label}
                </button>
              ))}
            </div>
          </div>

          <TrendLineChart
            data={biData.daily_trend}
            metric={trendMetric}
            color={metricConfig[trendMetric].color}
            gradientId={`admin-bi-${trendMetric}`}
            formatValue={metricConfig[trendMetric].format}
            lang={lang}
          />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#728C69]" />
              <h2 className="font-serif text-xl">{t("bi.categoryTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t("bi.categorySubtitle")}</p>
          </div>

          {byCategory.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    strokeWidth="16"
                  />
                  {byCategory.map((item, idx) => {
                    const val = Number(item.bookings_count || 0);
                    const ratio = totalCatBookings > 0 ? val / totalCatBookings : 0;
                    const dash = ratio * donutCirc;
                    const offset = -accumulatedDash;
                    accumulatedDash += dash;
                    return (
                      <circle
                        key={`${item.category}-${idx}`}
                        cx="70"
                        cy="70"
                        r={donutRadius}
                        fill="none"
                        stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                        strokeWidth="16"
                        strokeDasharray={`${dash} ${donutCirc}`}
                        strokeDashoffset={offset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-serif text-2xl font-bold">{totalCatBookings}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("bi.donutCenter")}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3.5">
                {byCategory.map((item, idx) => {
                  const count = Number(item.bookings_count || 0);
                  const maxB = Math.max(1, ...byCategory.map((c) => Number(c.bookings_count || 0)));
                  const pct = Math.min(100, Math.round((count / maxB) * 100));
                  const barColor = DONUT_COLORS[idx % DONUT_COLORS.length];
                  return (
                    <div key={`${item.category}-${idx}`} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium gap-2">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: barColor }}
                          />
                          {formatCategory(item.category)}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({item.revenue_share_pct ?? 0}%) · $
                          {Number(item.revenue).toFixed(0)} MXN
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#F2EFE9] dark:bg-[#18201C] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([cat, count]) => {
                const pct = Math.min(100, Math.round((count / Math.max(1, experiences.length)) * 100));
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{formatCategory(cat)}</span>
                      <span>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#F2EFE9] dark:bg-[#18201C] rounded-full overflow-hidden">
                      <div className="h-full bg-[#728C69] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#C81D77]" />
              <h2 className="font-serif text-xl">{t("bi.boroughTitle")}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t("bi.boroughSubtitle")}</p>
          </div>

          {overview?.by_borough && overview.by_borough.length > 0 ? (
            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {(() => {
                const maxMetric = Math.max(
                  1,
                  ...overview.by_borough.map((b) => Math.max(b.bookings_count, b.experiences_count))
                );
                return overview.by_borough.map((b) => {
                  const demandWidth = Math.min(100, Math.round((b.bookings_count / maxMetric) * 100));
                  const supplyWidth = Math.min(100, Math.round((b.experiences_count / maxMetric) * 100));
                  return (
                    <div key={b.borough} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold">{b.borough}</span>
                        <span className="text-muted-foreground">
                          {t("bi.boroughExps", { count: b.experiences_count })} ·{" "}
                          {t("bi.boroughBookings", { count: b.bookings_count })} · $
                          {b.revenue.toFixed(0)} MXN
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F2EFE9] dark:bg-[#18201C] rounded-full overflow-hidden flex gap-0.5">
                        <div
                          className="h-full bg-[#C81D77] rounded-l-full"
                          style={{ width: `${demandWidth}%` }}
                          title={t("bi.boroughBookings", { count: b.bookings_count })}
                        />
                        <div
                          className="h-full bg-[#728C69]/70 rounded-r-full"
                          style={{ width: `${Math.max(4, supplyWidth / 2)}%` }}
                          title={t("bi.boroughExps", { count: b.experiences_count })}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("bi.boroughEmpty")}</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-serif text-xl">{t("bi.topExperiencesTitle")}</h2>
          {Array.isArray(biData.top_experiences) && biData.top_experiences.length > 0 ? (
            <div className="space-y-2.5">
              {biData.top_experiences.map((exp, idx) => (
                <div
                  key={exp.experience_id}
                  className="flex items-center justify-between gap-3 bg-[#F2EFE9] dark:bg-[#18201C] px-4 py-3 rounded-2xl text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold truncate">
                      #{idx + 1} · {exp.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatCategory(exp.category)} · {exp.borough_cdmx} ·{" "}
                      {t("bi.bookingsTourists", {
                        bookings: exp.bookings_count,
                        tourists: exp.tourists,
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[#3B523E] dark:text-[#A5B29A]">
                      ${Number(exp.revenue).toFixed(2)} MXN
                    </div>
                    <div className="text-[10px] text-[#728C69]">
                      +${Number(exp.impact_fund).toFixed(2)} eco
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("common.noData")}</p>
          )}
        </section>

        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase text-[#C81D77]">
              {t("bi.platformSubtitle")}
            </span>
            <h2 className="font-serif text-xl mt-1 mb-2">{t("bi.platformTitle")}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("bi.platformDesc")}</p>
          </div>

          {Array.isArray(biData.top_providers) && biData.top_providers.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#728C69] mb-2">
                {t("bi.topProvidersTitle")}
              </h3>
              <div className="space-y-2">
                {biData.top_providers.map((prov, idx) => (
                  <div
                    key={prov.provider_id ?? idx}
                    className="flex items-center justify-between text-xs bg-[#F2EFE9] dark:bg-[#18201C] px-3.5 py-2.5 rounded-xl"
                  >
                    <span className="font-semibold">
                      {t("bi.providerLabel", { id: prov.provider_id })}
                    </span>
                    <span className="text-muted-foreground">
                      {t("bi.bookingsTourists", {
                        bookings: prov.bookings_count ?? 0,
                        tourists: prov.tourists ?? 0,
                      })}{" "}
                      · ${Number(prov.revenue ?? 0).toFixed(2)} MXN
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#F2EFE9] dark:bg-[#18201C] flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("bi.avgImpactTourist")}
              </span>
              <span className="font-serif text-2xl font-bold text-[#728C69]">
                ${Number(kpis.avg_impact_per_tourist ?? 0).toFixed(2)} MXN
              </span>
            </div>
            <Leaf className="w-8 h-8 text-[#728C69]" />
          </div>
        </section>
      </div>

      {Array.isArray(biData.service_health) && biData.service_health.length > 0 && (
        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#728C69]" />
            <div>
              <h2 className="font-serif text-xl">{t("bi.healthTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("bi.healthSubtitle")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {biData.service_health.map((svc) => {
              const isUp = svc.status === "UP";
              return (
                <div
                  key={svc.service}
                  className="rounded-2xl p-3.5 bg-[#F2EFE9] dark:bg-[#18201C] border border-transparent dark:border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{svc.service}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isUp ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold ${
                        isUp
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {isUp ? t("bi.healthUp") : t("bi.healthDegraded")}
                    </span>
                    <span className="text-muted-foreground">
                      {svc.latency_ms !== null
                        ? t("bi.latencyMs", { ms: svc.latency_ms })
                        : t("bi.latencyNa")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
