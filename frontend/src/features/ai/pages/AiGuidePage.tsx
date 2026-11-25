import React from "react";
import { Sparkles } from "lucide-react";
import { useCatalog } from "../../../context/CatalogContext";
import { useModals } from "../../../context/ModalContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAiAssistant } from "../hooks/useAiAssistant";

export default function AiGuidePage() {
  const { t, formatCategory } = useLanguage();
  const { experiences } = useCatalog();
  const { openDetail } = useModals();
  const { message, setMessage, reply, suggestions, loading, handleAsk } = useAiAssistant();

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
      <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#728C69]/15 text-[#728C69] text-xs font-bold uppercase mb-3">
          <Sparkles className="w-4 h-4" /> {t("ai.badge")}
        </div>
        <h1 className="font-serif text-3xl mb-2">{t("ai.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("ai.subtitle")}</p>

        <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("ai.placeholder")}
            className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-12 text-sm"
          />
          <button
            disabled={loading}
            type="submit"
            className="bg-[#C81D77] hover:bg-[#A91864] text-white rounded-xl px-6 h-12 text-sm font-medium transition"
          >
            {loading ? t("ai.btnAnalyzing") : t("ai.btnRecommend")}
          </button>
        </form>

        {reply && (
          <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-6 rounded-2xl text-sm leading-relaxed space-y-4">
            <p>{reply}</p>
            {suggestions.length > 0 && (
              <div className="pt-3 border-t border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#728C69] mb-3">
                  {t("ai.suggestionsTitle", { count: suggestions.length })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((sug) => {
                    const fullExp =
                      experiences.find((e) => Number(e.id) === Number(sug.id)) || sug;
                    return (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => openDetail(fullExp)}
                        className="text-left bg-white dark:bg-[#2A312C] rounded-2xl p-4 shadow-sm hover:border-[#728C69] border border-transparent transition-all"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#728C69]">
                          {formatCategory(fullExp.category)} · {fullExp.borough_cdmx}
                        </span>
                        <h4 className="font-serif text-base font-bold mt-1 line-clamp-1">
                          {fullExp.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${fullExp.price} {t("common.mxn")} · {t("ai.viewDetail")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
