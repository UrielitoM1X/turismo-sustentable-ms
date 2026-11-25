import React from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Leaf } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { CDMX_BOROUGHS } from "../../../shared/constants/catalog";
import CollabBenefitsPanel from "../components/CollabBenefitsPanel";
import { OrganizationType, useCollabForm } from "../hooks/useCollabForm";

export default function CollabPage() {
  const { t } = useLanguage();
  const form = useCollabForm();

  return (
    <main className="relative flex-1 w-full bg-[#F2EFE9] dark:bg-[#18201C] transition-colors duration-300 py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-28 -right-28 w-[420px] h-[420px] rounded-full bg-[#E3E5D8]/70 dark:bg-[#202823]/70 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full bg-[#F5DCE8]/50 dark:bg-[#382430]/30 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.25em] text-[#C81D77] dark:text-[#E24A96] uppercase">
            <Leaf className="w-3.5 h-3.5" />
            {t("collab.badge")}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#1E201D] dark:text-white">
            {t("collab.title")}
          </h1>
          <p className="text-sm sm:text-base text-[#63665E] dark:text-[#9EA399] max-w-2xl mx-auto">
            {t("collab.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-7 sm:p-8 shadow-sm border border-transparent dark:border-white/5">
            {form.submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 text-[#728C69] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="font-serif text-2xl text-[#1E201D] dark:text-white">
                  {t("collab.successTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-[#63665E] dark:text-[#9EA399] max-w-sm mx-auto leading-relaxed">
                  {t("collab.successDesc", {
                    name: form.name,
                    org: form.organization || form.borough,
                  })}
                </p>
                <button
                  type="button"
                  onClick={form.reset}
                  className="bg-[#728C69] hover:bg-[#5B7153] text-white text-xs font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  {t("collab.sendAnother")}
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-2xl text-[#1E201D] dark:text-white mb-1">
                  {t("collab.formTitle")}
                </h2>
                <p className="text-xs text-[#63665E] dark:text-[#9EA399] mb-6">
                  {t("collab.formSubtitle")}
                </p>

                <form onSubmit={form.handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium block">
                      {t("collab.fieldName")}
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => form.setName(e.target.value)}
                      placeholder={t("collab.placeholderName")}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium block">
                      {t("collab.fieldEmail")}
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => form.setEmail(e.target.value)}
                      placeholder={t("collab.placeholderEmail")}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium block">
                      {t("collab.fieldOrg")}
                    </label>
                    <input
                      required
                      value={form.organization}
                      onChange={(e) => form.setOrganization(e.target.value)}
                      placeholder={t("collab.placeholderOrg")}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium block">
                        {t("collab.fieldOrgType")}
                      </label>
                      <select
                        value={form.orgType}
                        onChange={(e) => form.setOrgType(e.target.value as OrganizationType)}
                        className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
                      >
                        <option value="cooperative">{t("collab.typeCoop")}</option>
                        <option value="guide">{t("collab.typeGuide")}</option>
                        <option value="ngo">{t("collab.typeNgo")}</option>
                        <option value="institution">{t("collab.typeInst")}</option>
                        <option value="other">{t("collab.typeOther")}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium block">
                        {t("collab.fieldBorough")}
                      </label>
                      <select
                        value={form.borough}
                        onChange={(e) => form.setBorough(e.target.value)}
                        className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
                      >
                        {CDMX_BOROUGHS.map((alc) => (
                          <option key={alc} value={alc}>
                            {alc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium block">
                      {t("collab.fieldMessage")}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => form.setMessage(e.target.value)}
                      placeholder={t("collab.placeholderMessage")}
                      className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
                    />
                  </div>

                  {form.error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{form.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#C81D77] hover:bg-[#A91864] dark:bg-[#E24A96] dark:hover:bg-[#C81D77] text-white font-semibold rounded-xl h-12 text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {t("collab.submitBtn")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>

          <CollabBenefitsPanel />
        </div>
      </div>
    </main>
  );
}
