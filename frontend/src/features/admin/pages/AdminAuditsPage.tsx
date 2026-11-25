import React from "react";
import { ArrowRight, CheckCircle2, Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { CATALOG_CATEGORIES } from "../../../shared/constants/catalog";
import AuditDetailView from "../components/AuditDetailView";
import { useAdminAudits } from "../hooks/useAdminAudits";

export default function AdminAuditsPage() {
  const { t, formatCategory } = useLanguage();
  const state = useAdminAudits();

  if (state.selectedAudit) {
    return (
      <AuditDetailView
        audit={state.selectedAudit}
        reviewerNotes={state.reviewerNotes}
        setReviewerNotes={state.setReviewerNotes}
        isSubmitting={state.isSubmitting}
        openingFileId={state.openingFileId}
        statusMessage={state.statusMessage}
        onBack={state.clearSelection}
        onOpenFile={state.openEvidenceFile}
        onResolve={state.resolveAudit}
      />
    );
  }

  const categories = [
    { value: "Todos", label: t("audits.catAll") },
    ...CATALOG_CATEGORIES.map((cat) => ({ value: cat, label: formatCategory(cat) })),
  ];

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif mb-2 font-bold">{t("audits.listTitle")}</h1>
          <p className="text-sm text-[#63665E] dark:text-[#A5B29A]">{t("audits.listSub")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl bg-white dark:bg-[#2A312C] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8C9287] uppercase tracking-wider">
                {t("audits.statPending")}
              </span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-serif text-amber-600 mt-2 font-bold">
              {state.isLoading ? "..." : state.audits.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#2A312C] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8C9287] uppercase tracking-wider">
                {t("audits.statStorage")}
              </span>
              <ShieldAlert className="h-5 w-5 text-[#C81D77]" />
            </div>
            <p className="text-2xl font-serif text-[#C81D77] mt-2 font-bold">RustFS / S3</p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#2A312C] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#8C9287] uppercase tracking-wider">
                {t("audits.statCriteria")}
              </span>
              <CheckCircle2 className="h-5 w-5 text-[#728C69]" />
            </div>
            <p className="text-2xl font-serif text-[#728C69] mt-2 font-bold">
              100% {t("common.cdmx")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => state.setSelectedCategory(cat.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all ${
                state.selectedCategory === cat.value
                  ? "bg-[#728C69] text-white shadow-sm"
                  : "bg-white dark:bg-[#2A312C] text-[#63665E] dark:text-[#A5B29A]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {state.loadError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300 mb-6">
            {state.loadError}
          </div>
        )}

        {state.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("audits.loading")}</p>
        ) : state.filteredAudits.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center bg-white dark:bg-[#2A312C]">
            <ShieldCheck className="w-10 h-10 text-[#728C69] mx-auto mb-2" />
            <p className="text-[#8C9287] text-sm">{t("audits.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {state.filteredAudits.map((audit) => (
              <div
                key={audit.id}
                className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="w-full h-36 bg-[#B4CBB0] rounded-2xl mb-4 relative overflow-hidden">
                    <svg
                      viewBox="0 0 400 120"
                      className="w-full h-full object-cover"
                      preserveAspectRatio="none"
                    >
                      <circle cx="320" cy="40" r="20" fill="#F4E6B4" />
                      <polygon points="0,120 150,50 350,120" fill="#758C6E" />
                      <polygon points="100,120 280,70 450,120" fill="#586E52" />
                    </svg>
                    <span className="absolute top-3 right-3 bg-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full text-[#1E201D]">
                      {t("audits.evCount", { count: audit.files?.length || 1 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#728C69] uppercase tracking-wider">
                      {formatCategory(audit.category)}
                    </span>
                    <span>·</span>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      {t("audits.caseNum", { id: audit.id })}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold mb-2">{audit.business_name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {audit.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-[#8C9287]">
                    {t("audits.providerNum", { id: audit.provider_id })}
                  </span>
                  <button
                    onClick={() => state.setSelectedAudit(audit)}
                    className="inline-flex items-center gap-1.5 bg-[#C81D77] hover:bg-[#A91864] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    {t("audits.review")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
