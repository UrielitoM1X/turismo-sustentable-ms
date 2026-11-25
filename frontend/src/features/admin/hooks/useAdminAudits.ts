import { useCallback, useEffect, useMemo, useState } from "react";
import { AuditSubmission, catalogService } from "../../../api/services/catalogService";
import { useCatalog } from "../../../context/CatalogContext";
import { useLanguage } from "../../../i18n/LanguageContext";

export function useAdminAudits() {
  const { t } = useLanguage();
  const { reloadCatalog } = useCatalog();

  const [audits, setAudits] = useState<AuditSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedAudit, setSelectedAudit] = useState<AuditSubmission | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await catalogService.getPendingAudits();
      setAudits(data);
    } catch (err: any) {
      setLoadError(err.message || t("audits.loading"));
      setAudits([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const openEvidenceFile = async (fileId: number) => {
    setOpeningFileId(fileId);
    try {
      const blob = await catalogService.fetchAuditFileBlob(fileId);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setOpeningFileId(null);
    }
  };

  const resolveAudit = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedAudit || isSubmitting) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await catalogService.resolveAudit(
        selectedAudit.id,
        decision,
        reviewerNotes.trim() ||
          (decision === "APPROVED" ? t("audits.defaultApproved") : t("audits.defaultRejected"))
      );

      setStatusMessage({
        type: "success",
        text:
          decision === "APPROVED"
            ? t("audits.approvedMsg", { id: selectedAudit.id })
            : t("audits.rejectedMsg", { id: selectedAudit.id }),
      });

      await reloadCatalog();

      const resolvedId = selectedAudit.id;
      setTimeout(() => {
        setAudits((prev) => prev.filter((a) => a.id !== resolvedId));
        setSelectedAudit(null);
        setReviewerNotes("");
        setStatusMessage(null);
        setIsSubmitting(false);
      }, 900);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setIsSubmitting(false);
    }
  };

  const filteredAudits = useMemo(
    () =>
      audits.filter((a) =>
        selectedCategory === "Todos"
          ? true
          : a.category?.toLowerCase() === selectedCategory.toLowerCase()
      ),
    [audits, selectedCategory]
  );

  const clearSelection = () => {
    setSelectedAudit(null);
    setStatusMessage(null);
  };

  return {
    audits,
    filteredAudits,
    isLoading,
    loadError,
    selectedCategory,
    setSelectedCategory,
    selectedAudit,
    setSelectedAudit,
    clearSelection,
    reviewerNotes,
    setReviewerNotes,
    isSubmitting,
    openingFileId,
    statusMessage,
    openEvidenceFile,
    resolveAudit,
  };
}
