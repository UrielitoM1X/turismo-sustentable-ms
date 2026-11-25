import { useCallback, useEffect, useMemo, useState } from "react";
import {
  biService,
  ProviderBiSummary,
  ProviderExperienceMetric,
} from "../../../api/services/biService";
import { catalogService, Experience } from "../../../api/services/catalogService";
import { TrendMetricKey } from "../../../components/TrendLineChart";
import { useLanguage } from "../../../i18n/LanguageContext";

export function useProviderMonitoring() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<ProviderBiSummary | null>(null);
  const [myExperiences, setMyExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendMetric, setTrendMetric] = useState<TrendMetricKey>("revenue");

  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [biRes, expRes] = await Promise.all([
        biService.getProviderSummary(),
        catalogService.getMyExperiences().catch(() => []),
      ]);
      setSummary(biRes);
      setMyExperiences(expRes);
    } catch (err: any) {
      setError(err.message || t("provMon.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  const mergedServices = useMemo<ProviderExperienceMetric[]>(() => {
    const metricsByExpId = new Map(
      (summary?.by_experience || []).map((item) => [Number(item.experience_id), item])
    );
    const map = new Map<number, ProviderExperienceMetric>();

    myExperiences.forEach((exp) => {
      const id = Number(exp.id);
      const bi = metricsByExpId.get(id);
      map.set(id, {
        experience_id: id,
        title: exp.title,
        category: exp.category,
        borough_cdmx: exp.borough_cdmx,
        is_active: Boolean(exp.is_active),
        max_capacity: Number(exp.max_capacity || 0),
        price: Number(exp.price || 0),
        bookings_count: bi?.bookings_count ?? 0,
        tourists: bi?.tourists ?? 0,
        avg_group_size: bi?.avg_group_size ?? 0,
        revenue: bi?.revenue ?? 0,
        impact_fund: bi?.impact_fund ?? 0,
        last_booking_at: bi?.last_booking_at ?? null,
      });
    });

    (summary?.by_experience || []).forEach((bi) => {
      const id = Number(bi.experience_id);
      if (!map.has(id)) {
        map.set(id, bi);
      }
    });

    return Array.from(map.values());
  }, [myExperiences, summary]);

  return {
    summary,
    mergedServices,
    loading,
    error,
    trendMetric,
    setTrendMetric,
    loadMonitoring,
  };
}
