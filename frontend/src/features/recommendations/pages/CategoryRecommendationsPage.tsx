import React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import DestinationBubbleMap from "../components/DestinationBubbleMap";
import { useCategoryRecommendations } from "../hooks/useRecommendations";

export default function CategoryRecommendationsPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { t } = useLanguage();
  const { category, bubbles, onlyWithActive, toggleOnlyWithActive } =
    useCategoryRecommendations(categorySlug);

  return (
    <main className="relative flex-1 min-h-[calc(100vh-4rem)] w-full flex flex-col bg-[#F2EFE9] dark:bg-[#18201C] transition-colors duration-300 py-10 px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1">
        <div className="w-full flex flex-wrap justify-between items-end gap-4 mb-6 relative z-10 border-b-2 border-pink-200/50 dark:border-pink-900/30 pb-4">
          <div>
            <span className="text-[#C81D77] dark:text-[#E24A96] text-xs font-bold tracking-[0.2em] uppercase block mb-1">
              {t("recs.categoryBadge")}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1E201D] dark:text-white">
              {t(category.titleKey)}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleOnlyWithActive}
              className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
                onlyWithActive
                  ? "bg-[#728C69] text-white border-[#728C69]"
                  : "bg-white dark:bg-[#252D28] text-[#728C69] dark:text-[#A5B29A] border-[#728C69]/30 hover:border-[#728C69]"
              }`}
            >
              <img src="/hoja.svg" alt="" className="w-3.5 h-3.5 opacity-80 dark:hidden" />
              <img src="/hoja_oscura.svg" alt="" className="w-3.5 h-3.5 hidden dark:block" />
              {onlyWithActive ? t("recs.filterActiveOnly") : t("recs.filterLimit")}
            </button>

            <Link
              to={ROUTES.RECOMMENDATIONS}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#202823] shadow-sm hover:bg-[#E5E4DB] dark:hover:bg-[#2A352F] text-[#3B523E] dark:text-[#E2E4DE] transition-colors duration-300 border border-transparent dark:border-white/10"
              title={t("recs.backToHub")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <DestinationBubbleMap categorySlug={category.slug} bubbles={bubbles} />
      </div>
    </main>
  );
}
