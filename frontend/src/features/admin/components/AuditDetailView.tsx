import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import { AuditSubmission } from "../../../api/services/catalogService";
import { useLanguage } from "../../../i18n/LanguageContext";

interface AuditDetailViewProps {
  audit: AuditSubmission;
  reviewerNotes: string;
  setReviewerNotes: (value: string) => void;
  isSubmitting: boolean;
  openingFileId: number | null;
  statusMessage: { type: "success" | "error"; text: string } | null;
  onBack: () => void;
  onOpenFile: (fileId: number) => void;
  onResolve: (decision: "APPROVED" | "REJECTED") => void;
}

export default function AuditDetailView({
  audit,
  reviewerNotes,
  setReviewerNotes,
  isSubmitting,
  openingFileId,
  statusMessage,
  onBack,
  onOpenFile,
  onResolve,
}: AuditDetailViewProps) {
  const { t, formatCategory, formatStatus } = useLanguage();

  return (
    <main className="flex-1 w-full bg-[#F4F1EA] dark:bg-[#18201C] transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8 pb-28">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#2A312C] flex items-center justify-center shadow-sm hover:bg-[#E3E5D8]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif text-3xl font-bold">{t("audits.backTitle")}</h1>
            <p className="text-xs text-[#63665E] dark:text-[#A5B29A]">
              {t("audits.backSub", { id: audit.id })}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs mb-6 text-center font-medium ${
              statusMessage.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
            <div className="w-full h-40 bg-[#B4CBB0] rounded-2xl mb-4 relative overflow-hidden">
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
                {formatStatus(audit.status || "PENDING")}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="font-bold text-[#728C69] uppercase">
                {formatCategory(audit.category)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" /> {t("common.cdmx")}
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold mb-2">{audit.business_name}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {audit.description}
            </p>

            <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <User className="w-3.5 h-3.5 text-[#728C69]" />
                {t("audits.providerId", { id: audit.provider_id })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-serif text-xl font-bold">{t("audits.evidenceTitle")}</h3>
              {Array.isArray(audit.files) && audit.files.length > 0 ? (
                audit.files.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl bg-[#F4F1EA] dark:bg-[#18201C] border border-[#728C69]/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#728C69]/20 text-[#728C69] rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">{f.file_name}</h4>
                        <span className="text-[10px] text-muted-foreground">
                          {t("audits.fileType", { type: f.file_type })}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={openingFileId === f.id}
                      onClick={() => onOpenFile(f.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#728C69] hover:bg-[#5B7153] text-white px-3.5 py-2 rounded-xl transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {openingFileId === f.id ? t("audits.openingFile") : t("audits.openFile")}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-5 rounded-2xl bg-[#F4F1EA] dark:bg-[#18201C] border border-[#728C69]/20 flex items-center gap-3.5">
                  <FileText className="w-5 h-5 text-[#728C69]" />
                  <span className="text-xs">
                    {t("audits.fallbackFile", { id: audit.id })}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold mb-2">{t("audits.notesTitle")}</h3>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder={t("audits.notesPlaceholder")}
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-[#F4F1EA]/95 dark:bg-[#18201C]/95 backdrop-blur-md p-4 flex gap-4 justify-center border-t border-border shadow-lg z-30">
          <button
            disabled={isSubmitting}
            onClick={() => onResolve("REJECTED")}
            className="w-full max-w-xs bg-[#C81D77] hover:bg-[#A91864] text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            {isSubmitting ? t("common.processing") : t("audits.reject")}
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => onResolve("APPROVED")}
            className="w-full max-w-xs bg-[#728C69] hover:bg-[#5B7153] text-white font-semibold rounded-2xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? t("common.processing") : t("audits.approve")}
          </button>
        </div>
      </div>
    </main>
  );
}
