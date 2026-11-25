import React from "react";
import { AlertTriangle, RefreshCw, UploadCloud } from "lucide-react";
import { AuditSubmission } from "../../../api/services/catalogService";
import { useLanguage } from "../../../i18n/LanguageContext";

interface ProviderAuditsListProps {
  audits: AuditSubmission[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export default function ProviderAuditsList({
  audits,
  loading,
  error,
  onRefresh,
  onCreateNew,
}: ProviderAuditsListProps) {
  const { t, formatCategory } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 mb-6 border bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-start justify-between gap-3.5">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">{t("provider.auditsBannerTitle")}</h3>
            <p className="text-xs mt-1 leading-relaxed">{t("provider.auditsBannerDesc")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white dark:bg-[#2A312C] text-[#1E201D] dark:text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm hover:bg-[#E3E5D8]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("provider.auditsLoading")}</p>
      ) : audits.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#2A312C] rounded-2xl border border-dashed border-[#8C9287]/40">
          <UploadCloud className="h-10 w-10 text-[#728C69] mx-auto mb-2" />
          <p className="text-sm text-[#8C9287] mb-3">{t("provider.auditsEmpty")}</p>
          <button
            onClick={onCreateNew}
            className="text-xs bg-[#728C69] text-white px-4 py-2 rounded-xl font-medium"
          >
            {t("provider.auditsEmptyCta")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {audits.map((doc) => {
            const statusUpper = String(doc.status || "PENDING").toUpperCase();
            const isApproved = statusUpper === "APPROVED";
            const isRejected = statusUpper === "REJECTED";

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-[#2A312C] rounded-2xl p-5 shadow-sm space-y-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold text-[#728C69] uppercase tracking-wider">
                    {t("provider.auditTag", { id: doc.id, cat: formatCategory(doc.category) })}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-800"
                        : isRejected
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isApproved
                      ? t("provider.statusApproved")
                      : isRejected
                      ? t("provider.statusRejected")
                      : t("provider.statusPending")}
                  </span>
                </div>
                <h3 className="font-semibold text-sm">{doc.business_name}</h3>
                <p className="text-xs text-[#63665E] dark:text-[#A5B29A] line-clamp-2">
                  {doc.description}
                </p>
                <p className="text-[11px] text-[#8C9287]">
                  {t("provider.filesAttached", { count: doc.files_count || 1 })}
                </p>
                {doc.reviewer_notes && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      isRejected
                        ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                        : "bg-[#F4F1EA] dark:bg-[#18201C] text-[#3B523E] dark:text-[#A5B29A]"
                    }`}
                  >
                    <strong>{t("provider.reviewerNotes")}</strong> {doc.reviewer_notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
