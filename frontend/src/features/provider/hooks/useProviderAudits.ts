import { useCallback, useEffect, useState } from "react";
import { AuditSubmission, catalogService } from "../../../api/services/catalogService";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../i18n/LanguageContext";

export function useProviderAudits() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [audits, setAudits] = useState<AuditSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAudits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await catalogService.getMyAudits();
      setAudits(list);
    } catch (err: any) {
      setError(err.message || t("provider.auditsLoadError"));
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (session.token) {
      loadAudits();
    }
  }, [session.token, loadAudits]);

  return {
    audits,
    loading,
    error,
    loadAudits,
  };
}
