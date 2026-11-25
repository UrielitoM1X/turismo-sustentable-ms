import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import { RecommendationCategorySlug } from "../data/categories";
import { DestinationBubbleItem } from "../hooks/useRecommendations";

interface DestinationBubbleMapProps {
  categorySlug: RecommendationCategorySlug;
  bubbles: DestinationBubbleItem[];
}

export default function DestinationBubbleMap({
  categorySlug,
  bubbles,
}: DestinationBubbleMapProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile / tablet responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 py-6 md:hidden">
        {bubbles.map((dest) => (
          <Link
            key={dest.slug}
            to={`${ROUTES.RECOMMENDATIONS}/${categorySlug}/${dest.slug}`}
            className={`${dest.bg} aspect-square rounded-full flex flex-col items-center justify-center text-center p-4 border border-[#728C69]/40 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:scale-105`}
          >
            {dest.icon && (
              <div className="mb-1 opacity-70">
                <img src="/hoja.svg" alt="" className="w-4 h-4 dark:hidden" />
                <img src="/hoja_oscura.svg" alt="" className="w-4 h-4 hidden dark:block" />
              </div>
            )}
            <span className="font-serif text-[#1E201D] dark:text-white text-sm leading-tight">
              {dest.name}
            </span>
            {dest.matchedCount > 0 && (
              <span className="mt-1 text-[10px] font-semibold text-[#728C69] dark:text-[#A5B29A]">
                {t("recs.activeCount", { count: dest.matchedCount })}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Desktop orbital bubble map */}
      <div className="hidden md:block relative w-full h-[640px] lg:h-[740px] mt-4 flex-1">
        {bubbles.map((dest) => (
          <div
            key={dest.slug}
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 group hover:z-20"
            style={{ top: dest.top, left: dest.left }}
          >
            <Link
              to={`${ROUTES.RECOMMENDATIONS}/${categorySlug}/${dest.slug}`}
              className={`${dest.size} ${dest.bg} rounded-full flex flex-col items-center justify-center text-center p-4 border border-[#728C69]/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:scale-105`}
            >
              {dest.icon && (
                <div className="mb-1 opacity-70">
                  <img src="/hoja.svg" alt="" className="w-4 h-4 dark:hidden" />
                  <img src="/hoja_oscura.svg" alt="" className="w-4 h-4 hidden dark:block" />
                </div>
              )}
              <span className="font-serif text-[#1E201D] dark:text-white text-sm lg:text-lg leading-tight">
                {dest.name}
              </span>
              {dest.matchedCount > 0 && (
                <span className="mt-1 text-[10px] font-semibold text-[#728C69] dark:text-[#A5B29A]">
                  {t("recs.activeCount", { count: dest.matchedCount })}
                </span>
              )}
            </Link>

            <div className="flex flex-col gap-1 mt-3 opacity-30 group-hover:opacity-60 transition-opacity">
              <div className="w-1.5 h-1.5 rounded-full bg-[#728C69]" />
              <div className="w-1 h-1 rounded-full bg-[#728C69] mx-auto" />
              <div className="w-0.5 h-0.5 rounded-full bg-[#728C69] mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
