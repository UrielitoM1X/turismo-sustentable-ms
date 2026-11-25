import { useMemo, useState } from "react";
import { useCatalog } from "../../../context/CatalogContext";
import {
  CURATED_DESTINATIONS,
  CuratedDestination,
  findRecommendationCategory,
  matchesDestination,
  RECOMMENDATION_CATEGORIES,
} from "../data/categories";

export interface DestinationBubbleItem extends CuratedDestination {
  matchedCount: number;
}

export function useRecommendationsHub() {
  const { experiences } = useCatalog();

  const categoryCards = useMemo(
    () =>
      RECOMMENDATION_CATEGORIES.map((cat) => {
        const matchedCount = experiences.filter(cat.matchesExperience).length;
        return {
          ...cat,
          matchedCount,
          displayCount: matchedCount > 0 ? matchedCount : CURATED_DESTINATIONS.length,
        };
      }),
    [experiences]
  );

  return { categoryCards };
}

export function useCategoryRecommendations(categorySlug?: string) {
  const { experiences } = useCatalog();
  const [onlyWithActive, setOnlyWithActive] = useState(false);

  const category = useMemo(
    () => findRecommendationCategory(categorySlug),
    [categorySlug]
  );

  const categoryExperiences = useMemo(
    () => experiences.filter(category.matchesExperience),
    [experiences, category]
  );

  const bubbles = useMemo<DestinationBubbleItem[]>(() => {
    const all = CURATED_DESTINATIONS.map((dest) => ({
      ...dest,
      matchedCount: categoryExperiences.filter((exp) => matchesDestination(exp, dest)).length,
    }));

    if (!onlyWithActive) return all;
    const filtered = all.filter((item) => item.matchedCount > 0);
    return filtered.length > 0 ? filtered : all;
  }, [categoryExperiences, onlyWithActive]);

  return {
    category,
    bubbles,
    onlyWithActive,
    toggleOnlyWithActive: () => setOnlyWithActive((prev) => !prev),
    totalCategoryExperiences: categoryExperiences.length,
  };
}
