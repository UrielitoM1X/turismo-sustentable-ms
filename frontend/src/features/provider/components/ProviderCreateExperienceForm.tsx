import React from "react";
import { Paperclip } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { CATALOG_CATEGORIES, CDMX_BOROUGHS } from "../../../shared/constants/catalog";

interface ProviderCreateExperienceFormProps {
  form: {
    businessName: string;
    setBusinessName: (v: string) => void;
    title: string;
    setTitle: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    borough: string;
    setBorough: (v: string) => void;
    price: number;
    setPrice: (v: number) => void;
    duration: number;
    setDuration: (v: number) => void;
    capacity: number;
    setCapacity: (v: number) => void;
    practices: string;
    setPractices: (v: string) => void;
    petFriendly: boolean;
    setPetFriendly: (v: boolean) => void;
    accessible: boolean;
    setAccessible: (v: boolean) => void;
    setEvidenceFiles: (v: FileList | null) => void;
    createdAuditId: number | null;
    isSubmitting: boolean;
    evidenceInputRef: React.RefObject<HTMLInputElement | null>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
  };
}

export default function ProviderCreateExperienceForm({
  form,
}: ProviderCreateExperienceFormProps) {
  const { t, formatCategory } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl mx-auto">
      <h2 className="text-2xl font-serif mb-1 font-bold">{t("provider.formTitle")}</h2>
      <p className="text-xs text-muted-foreground mb-6">{t("provider.formSubtitle")}</p>

      <form onSubmit={form.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldBizName")}
            </label>
            <input
              required
              type="text"
              value={form.businessName}
              onChange={(e) => form.setBusinessName(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldTitle")}
            </label>
            <input
              required
              minLength={5}
              type="text"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder={t("provider.fieldTitlePlaceholder")}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">
            {t("provider.fieldDesc")}
          </label>
          <textarea
            required
            minLength={20}
            value={form.description}
            onChange={(e) => form.setDescription(e.target.value)}
            placeholder={t("provider.fieldDescPlaceholder")}
            rows={3}
            className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldCategory")}
            </label>
            <select
              value={form.category}
              onChange={(e) => form.setCategory(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            >
              {CATALOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldBorough")}
            </label>
            <select
              value={form.borough}
              onChange={(e) => form.setBorough(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            >
              {CDMX_BOROUGHS.map((alc) => (
                <option key={alc} value={alc}>
                  {alc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldPrice")}
            </label>
            <input
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => form.setPrice(Number(e.target.value))}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldDuration")}
            </label>
            <input
              required
              type="number"
              min={15}
              value={form.duration}
              onChange={(e) => form.setDuration(Number(e.target.value))}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">
              {t("provider.fieldCapacity")}
            </label>
            <input
              required
              type="number"
              min={1}
              max={50}
              value={form.capacity}
              onChange={(e) => form.setCapacity(Number(e.target.value))}
              className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
            />
          </div>
        </div>

        <div className="flex gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.petFriendly}
              onChange={(e) => form.setPetFriendly(e.target.checked)}
            />
            {t("common.petFriendly")}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.accessible}
              onChange={(e) => form.setAccessible(e.target.checked)}
            />
            {t("common.accessible")}
          </label>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">
            {t("provider.fieldPractices")}
          </label>
          <input
            required
            minLength={10}
            type="text"
            value={form.practices}
            onChange={(e) => form.setPractices(e.target.value)}
            className="w-full text-xs p-3 rounded-xl bg-[#F4F1EA] dark:bg-[#1E2420]"
          />
        </div>

        <div className="p-4 rounded-2xl bg-[#F4F1EA] dark:bg-[#1E2420] border border-dashed border-[#728C69]/50 space-y-2">
          <label className="text-xs font-bold flex items-center gap-1.5 text-[#3B523E] dark:text-[#A5B29A]">
            <Paperclip className="w-4 h-4 text-[#728C69]" />
            {t("provider.evidenceLabel")}
          </label>
          <p className="text-[11px] text-muted-foreground">{t("provider.evidenceHint")}</p>
          <input
            ref={form.evidenceInputRef}
            required={!form.createdAuditId}
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={(e) => form.setEvidenceFiles(e.target.files)}
            className="w-full text-xs p-2 rounded-xl bg-white dark:bg-[#2A312C]"
          />
          {form.createdAuditId && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              {t("provider.evidenceReused", { id: form.createdAuditId })}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={form.isSubmitting}
          className="w-full bg-[#C81D77] hover:bg-[#A91864] text-white py-3.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
        >
          {form.isSubmitting ? t("provider.submittingBtn") : t("provider.submitBtn")}
        </button>
      </form>
    </div>
  );
}
