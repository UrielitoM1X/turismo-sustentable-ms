import { useEffect, useMemo, useState } from "react";
import { Experience } from "../../../api/services/catalogService";
import { ReviewsResponse, socialService } from "../../../api/services/socialService";
import { useCatalog } from "../../../context/CatalogContext";
import {
  findCuratedDestination,
  findRecommendationCategory,
  matchesDestination,
} from "../data/categories";

const EMPTY_REVIEWS: ReviewsResponse = {
  average_rating: 0,
  total_reviews: 0,
  reviews: [],
};

export interface RatingBar {
  stars: number;
  count: number;
  percentage: number;
}

export function usePlaceDetail(categorySlug?: string, placeSlug?: string) {
  const { experiences } = useCatalog();

  const category = useMemo(
    () => findRecommendationCategory(categorySlug),
    [categorySlug]
  );
  const curatedDestination = useMemo(
    () => findCuratedDestination(placeSlug),
    [placeSlug]
  );

  const placeName = useMemo(() => {
    if (curatedDestination) return curatedDestination.name;
    if (!placeSlug) return "CDMX";
    return decodeURIComponent(placeSlug)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [curatedDestination, placeSlug]);

  const matchingExperiences = useMemo<Experience[]>(() => {
    const byCategory = experiences.filter(category.matchesExperience);
    if (!curatedDestination) return byCategory;

    const exact = byCategory.filter((exp) => matchesDestination(exp, curatedDestination));
    if (exact.length > 0) return exact;

    const anyCategoryInSpot = experiences.filter((exp) =>
      matchesDestination(exp, curatedDestination)
    );
    return anyCategoryInSpot.length > 0 ? anyCategoryInSpot : byCategory;
  }, [experiences, category, curatedDestination]);

  const [selectedExpId, setSelectedExpId] = useState<number | null>(null);
  const activeExperience = useMemo<Experience | null>(() => {
    if (matchingExperiences.length === 0) return null;
    return (
      matchingExperiences.find((e) => e.id === selectedExpId) || matchingExperiences[0]
    );
  }, [matchingExperiences, selectedExpId]);

  const [reviewsData, setReviewsData] = useState<ReviewsResponse>(EMPTY_REVIEWS);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!activeExperience) {
      setReviewsData(EMPTY_REVIEWS);
      return;
    }

    let cancelled = false;
    setLoadingReviews(true);
    socialService
      .getReviewsByExperience(activeExperience.id)
      .then((data) => {
        if (!cancelled) setReviewsData(data);
      })
      .catch(() => {
        if (!cancelled) setReviewsData(EMPTY_REVIEWS);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeExperience]);

  const ratingBars = useMemo<RatingBar[]>(() => {
    const total = reviewsData.reviews.length;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviewsData.reviews.filter((r) => Math.round(r.rating) === stars).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stars, count, percentage };
    });
  }, [reviewsData.reviews]);

  const visitorPhotos = useMemo<string[]>(() => {
    const urls: string[] = [];
    reviewsData.reviews.forEach((rev) => {
      if (Array.isArray(rev.photoKeys)) {
        rev.photoKeys.forEach((_, idx) => {
          urls.push(`/api/social/reviews/${rev._id}/photos/${idx}`);
        });
      }
    });
    return urls;
  }, [reviewsData.reviews]);

  return {
    category,
    placeName,
    matchingExperiences,
    activeExperience,
    setSelectedExpId,
    reviewsData,
    loadingReviews,
    ratingBars,
    visitorPhotos,
  };
}
