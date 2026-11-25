import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import CategoryIllustration from "../components/CategoryIllustration";
import { useRecommendationsHub } from "../hooks/useRecommendations";

export default function RecommendationsPage() {
  const { t } = useLanguage();
  const { categoryCards } = useRecommendationsHub();

  return (
    <main className="relative flex-1 min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center bg-[#F2EFE9] dark:bg-[#18201C] transition-colors duration-300 py-16 px-6 overflow-hidden">
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#EFE2BA]/40 dark:bg-[#2A2528]/40 -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#E5E4DB] dark:bg-[#121815] translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="z-10 w-full max-w-6xl flex flex-col items-center">
        <div className="text-center mb-12">
          <span className="text-[#C81D77] dark:text-[#E24A96] text-xs font-bold tracking-[0.3em] uppercase block mb-4">
            {t("recs.badge")}
          </span>
          <h1 className="font-serif text-5xl lg:text-6xl text-[#1E201D] dark:text-white mb-4">
            {t("recs.title")}
          </h1>
          <p className="text-[#63665E] dark:text-[#A5B29A] text-sm lg:text-base">
            {t("recs.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
          {categoryCards.map((card) => (
            <Link
              key={card.slug}
              to={`${ROUTES.RECOMMENDATIONS}/${card.slug}`}
              className="group flex flex-col bg-white dark:bg-[#252D28] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg dark:shadow-none border border-transparent dark:border-white/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-48 w-full relative overflow-hidden">
                <CategoryIllustration slug={card.slug} />
              </div>

              <div className="p-6 flex justify-between items-end bg-white dark:bg-[#252D28] transition-colors duration-300">
                <div>
                  <h3 className="font-serif text-2xl text-[#1E201D] dark:text-white mb-1">
                    {t(card.titleKey)}
                  </h3>
                  <p className="text-xs text-[#8C9287] dark:text-[#9EA399]">
                    {t("recs.placesCount", { count: card.displayCount })}
                  </p>
                </div>
                <div className="text-[#C81D77] dark:text-[#E24A96] group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to={ROUTES.EXPLORE}
          className="inline-flex items-center gap-2 bg-[#C81D77] hover:bg-[#A91864] dark:bg-[#E24A96] dark:hover:bg-[#C81D77] text-white font-medium rounded-full px-8 py-4 transition-colors duration-300 shadow-md"
        >
          {t("recs.alreadyInMind")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}
