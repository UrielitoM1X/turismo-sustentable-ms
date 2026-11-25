import { useCallback, useEffect, useState } from "react";
import { BiDashboardSummary, biService } from "../../../api/services/biService";
import { TrendMetricKey } from "../../../components/TrendLineChart";
import { useLanguage } from "../../../i18n/LanguageContext";

export function useAdminBi() {
  const { lang } = useLanguage();
  const [biData, setBiData] = useState<BiDashboardSummary | null>(null);
  const [biError, setBiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [trendMetric, setTrendMetric] = useState<TrendMetricKey>("revenue");

  const loadBi = useCallback(async () => {
    setLoading(true);
    setBiError("");
    try {
      const data = await biService.getSummary();
      setBiData(data);
      setLastUpdated(new Date().toLocaleTimeString(lang === "es" ? "es-MX" : "en-US"));
    } catch (err: any) {
      setBiError(err.message || "Error loading BI summary");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadBi();
  }, [loadBi]);

  return {
    biData,
    biError,
    loading,
    lastUpdated,
    trendMetric,
    setTrendMetric,
    loadBi,
  };
}
