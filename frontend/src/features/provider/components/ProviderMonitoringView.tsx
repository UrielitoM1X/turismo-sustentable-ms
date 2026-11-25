import React from "react";
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  DollarSign,
  Leaf,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { AuditSubmission } from "../../../api/services/catalogService";
import TrendLineChart, { TrendMetricKey } from "../../../components/TrendLineChart";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useProviderMonitoring } from "../hooks/useProviderMonitoring";

interface ProviderMonitoringViewProps {
  audits: AuditSubmission[];
  onCreateNew: () => void;
}

export default function ProviderMonitoringView({
  audits,
  onCreateNew,
}: ProviderMonitoringViewProps) {
  const { lang, t, formatCategory } = useLanguage();
  const {
    summary,
    mergedServices,
    loading,
    error,
    trendMetric,
    setTrendMetric,
    loadMonitoring,
  } = useProviderMonitoring();

  const activeServicesCount = mergedServices.filter((s) => s.is_active).length;
  const pendingServicesCount = mergedServices.length - activeServicesCount;
  const approvedAudits = audits.filter((a) => String(a.status).toUpperCase() === "APPROVED").length;
  const pendingAudits = audits.filter((a) => String(a.status).toUpperCase() === "PENDING").length;

  const metricConfig: Record<
    Exclude<TrendMetricKey, "impact_fund">,
    { label: string; color: string; format: (v: number) => string }
  > = {
    revenue: {
      label: t("provMon.metricRevenue"),
      color: "#3B523E",
      format: (v) => `$${v.toFixed(2)} MXN`,
    },
    bookings_count: {
      label: t("provMon.metricBookings"),
      color: "#C81D77",
      format: (v) => `${v} ${t("provMon.metricBookings").toLowerCase()}`,
    },
    tourists: {
      label: t("provMon.metricTourists"),
      color: "#728C69",
      format: (v) => `${v} ${t("provMon.metricTourists").toLowerCase()}`,
    },
  };

  const maxExpRevenue = Math.max(1, ...mergedServices.map((s) => Number(s.revenue || 0)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#1E201D] dark:text-white">
            {t("provMon.title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{t("provMon.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={loadMonitoring}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 bg-white dark:bg-[#2A312C] border border-gray-200 dark:border-white/10 hover:border-[#728C69] px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? t("common.refreshing") : t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("provMon.kpiServices")}</span>
            <Activity className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">{mergedServices.length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("provMon.kpiServicesSub", {
              active: activeServicesCount,
              pending: pendingServicesCount,
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("provMon.kpiBookings")}</span>
            <CalendarCheck2 className="w-4 h-4 text-[#C81D77]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">
            {summary?.kpis.total_bookings ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("provMon.kpiBookingsSub", {
              avg: Number(summary?.kpis.avg_ticket ?? 0).toFixed(2),
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("provMon.kpiRevenue")}</span>
            <DollarSign className="w-4 h-4 text-[#3B523E] dark:text-[#A5B29A]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#3B523E] dark:text-[#A5B29A] mt-2">
            ${Number(summary?.kpis.total_revenue ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("provMon.kpiRevenueSub", { unique: summary?.kpis.unique_tourists ?? 0 })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("provMon.kpiTourists")}</span>
            <Users className="w-4 h-4 text-[#C81D77]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#C81D77] mt-2">
            {summary?.kpis.total_tourists ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("provMon.kpiTouristsSub", {
              avg: Number(summary?.kpis.avg_group_size ?? 0).toFixed(1),
            })}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("provMon.kpiImpact")}</span>
            <Leaf className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#728C69] mt-2">
            ${Number(summary?.kpis.total_impact_fund ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">{t("provMon.kpiImpactSub")}</p>
        </div>

        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs">{t("provMon.kpiAudits")}</span>
            <ShieldCheck className="w-4 h-4 text-[#728C69]" />
          </div>
          <p className="font-serif text-3xl font-bold mt-2">{audits.length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("provMon.kpiAuditsSub", { approved: approvedAudits, pending: pendingAudits })}
          </p>
        </div>
      </div>

      {summary?.daily_trend && summary.daily_trend.length > 0 && (
        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#728C69]" />
              <h2 className="font-serif text-xl">{t("provMon.trendTitle")}</h2>
            </div>
            <div className="flex gap-1.5 bg-[#F4F1EA] dark:bg-[#18201C] p-1 rounded-xl self-start">
              {(Object.keys(metricConfig) as Array<Exclude<TrendMetricKey, "impact_fund">>).map(
                (key) => (
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
                )
              )}
            </div>
          </div>

          <TrendLineChart
            data={summary.daily_trend}
            metric={trendMetric}
            color={metricConfig[trendMetric === "impact_fund" ? "revenue" : trendMetric].color}
            gradientId={`prov-bi-${trendMetric}`}
            formatValue={
              metricConfig[trendMetric === "impact_fund" ? "revenue" : trendMetric].format
            }
            lang={lang}
          />
        </section>
      )}

      <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#728C69]" />
          <h2 className="font-serif text-xl">{t("provMon.servicesTitle")}</h2>
        </div>

        {mergedServices.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F4F1EA] dark:bg-[#18201C] text-center space-y-3">
            <p className="text-xs text-muted-foreground">{t("provMon.servicesEmpty")}</p>
            <button
              type="button"
              onClick={onCreateNew}
              className="bg-[#728C69] text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              {t("provMon.createFirst")}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 pr-4 font-semibold">{t("provMon.colService")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("provMon.colStatus")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("provMon.colPrice")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("provMon.colBookings")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("provMon.colTourists")}</th>
                  <th className="py-2.5 px-3 font-semibold">{t("provMon.colOccupancy")}</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">
                    {t("provMon.colRevenue")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {mergedServices.map((svc) => {
                  const occPct =
                    svc.max_capacity > 0
                      ? Math.min(100, Math.round((svc.avg_group_size / svc.max_capacity) * 100))
                      : 0;
                  const revWidth = Math.min(
                    100,
                    Math.round((Number(svc.revenue || 0) / maxExpRevenue) * 100)
                  );
                  return (
                    <tr key={svc.experience_id}>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-foreground">{svc.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatCategory(svc.category)} · {svc.borough_cdmx}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            svc.is_active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {svc.is_active && <CheckCircle2 className="w-3 h-3" />}
                          {svc.is_active ? t("provMon.statusActive") : t("provMon.statusPending")}
                        </span>
                      </td>
                      <td className="py-3 px-3">${Number(svc.price || 0).toFixed(0)} MXN</td>
                      <td className="py-3 px-3 font-semibold">{svc.bookings_count}</td>
                      <td className="py-3 px-3">{svc.tourists}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#F4F1EA] dark:bg-[#18201C] rounded-full overflow-hidden">
                            <div className="h-full bg-[#728C69]" style={{ width: `${occPct}%` }} />
                          </div>
                          <span>{occPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <div className="font-bold text-[#3B523E] dark:text-[#A5B29A]">
                          ${Number(svc.revenue || 0).toFixed(2)} MXN
                        </div>
                        <div className="w-20 ml-auto mt-1 h-1 bg-[#F4F1EA] dark:bg-[#18201C] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C81D77]" style={{ width: `${revWidth}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-serif text-xl">{t("provMon.categoryBreakdown")}</h2>
          {summary?.by_category && summary.by_category.length > 0 ? (
            <div className="space-y-3">
              {summary.by_category.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between bg-[#F4F1EA] dark:bg-[#18201C] px-4 py-3 rounded-2xl text-xs"
                >
                  <div>
                    <div className="font-bold">{formatCategory(cat.category)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {cat.bookings_count} {t("provMon.metricBookings").toLowerCase()} ·{" "}
                      {cat.tourists} {t("provMon.metricTourists").toLowerCase()}
                    </div>
                  </div>
                  <div className="font-bold text-[#3B523E] dark:text-[#A5B29A]">
                    ${Number(cat.revenue).toFixed(2)} MXN
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("common.noData")}</p>
          )}
        </section>

        <section className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="font-serif text-xl">{t("provMon.recentTitle")}</h2>
          {summary?.recent_bookings && summary.recent_bookings.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {summary.recent_bookings.map((b) => {
                const svc = mergedServices.find(
                  (s) => Number(s.experience_id) === Number(b.experience_id)
                );
                return (
                  <div
                    key={b.booking_id}
                    className="flex items-center justify-between gap-3 bg-[#F4F1EA] dark:bg-[#18201C] px-4 py-2.5 rounded-2xl text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {svc?.title || t("bookings.expTitle", { id: b.experience_id })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("provMon.bookingItem", { id: b.booking_id, guests: b.guests_count })}
                        {b.recorded_at ? ` · ${b.recorded_at.slice(0, 10)}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold">${Number(b.total_amount).toFixed(2)} MXN</div>
                      <div className="text-[10px] text-[#728C69]">
                        +${Number(b.impact_contribution).toFixed(2)} eco
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("provMon.recentEmpty")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
