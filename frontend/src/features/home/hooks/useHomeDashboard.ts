import { useEffect, useState } from "react";
import { BiDashboardSummary, biService, ProviderBiSummary } from "../../../api/services/biService";
import { AuditSubmission, catalogService, Experience } from "../../../api/services/catalogService";
import { useAuth } from "../../../context/AuthContext";
import { useCatalog } from "../../../context/CatalogContext";

export function useHomeDashboard() {
  const { session, isAdmin, isProvider } = useAuth();
  const { experiences } = useCatalog();

  const [pendingAudits, setPendingAudits] = useState<AuditSubmission[]>([]);
  const [biKpis, setBiKpis] = useState<BiDashboardSummary["kpis"] | null>(null);
  const [providerBi, setProviderBi] = useState<ProviderBiSummary | null>(null);
  const [providerExps, setProviderExps] = useState<Experience[]>([]);

  useEffect(() => {
    if (isAdmin && session.token) {
      catalogService
        .getPendingAudits()
        .then(setPendingAudits)
        .catch(() => setPendingAudits([]));
      biService
        .getSummary()
        .then((res) => setBiKpis(res.kpis))
        .catch(() => setBiKpis(null));
    }

    if (isProvider && session.token) {
      biService
        .getProviderSummary()
        .then(setProviderBi)
        .catch(() => setProviderBi(null));
      catalogService
        .getMyExperiences()
        .then(setProviderExps)
        .catch(() => setProviderExps([]));
    }
  }, [isAdmin, isProvider, session.token]);

  return {
    pendingAudits,
    biKpis,
    experiencesCount: experiences.length,
    providerBi,
    providerExps,
  };
}
