import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReviewsResponse, socialService } from "../../../api/services/socialService";
import { useAuth } from "../../../context/AuthContext";
import { useBookings } from "../../../context/BookingsContext";
import { useLanguage } from "../../../i18n/LanguageContext";

const EMPTY_REVIEWS: ReviewsResponse = {
  average_rating: 0,
  total_reviews: 0,
  reviews: [],
};

export function useExperienceReviews(experienceId: number | null) {
  const { t } = useLanguage();
  const { currentUserId, session, isTourist } = useAuth();
  const { hasVisitedExperience, reloadBookings } = useBookings();

  const [reviewsData, setReviewsData] = useState<ReviewsResponse>(EMPTY_REVIEWS);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [ecoVerified, setEcoVerified] = useState(true);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async (id: number) => {
    try {
      const data = await socialService.getReviewsByExperience(id);
      setReviewsData(data);
    } catch {
      setReviewsData(EMPTY_REVIEWS);
    }
  }, []);

  useEffect(() => {
    setReviewsData(EMPTY_REVIEWS);
    setMessage(null);
    setComment("");
    setPhotos(null);
    if (photosInputRef.current) {
      photosInputRef.current.value = "";
    }

    if (experienceId !== null) {
      loadReviews(experienceId);
      if (session.token && isTourist) {
        reloadBookings();
      }
    }
  }, [experienceId, session.token, isTourist, loadReviews, reloadBookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (experienceId === null) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await socialService.publishReview({
        experienceId,
        rating,
        comment: comment.trim(),
        ecologicalComplianceVerified: ecoVerified,
        photos: photos ? Array.from(photos) : [],
      });

      setMessage({ type: "ok", text: t("detail.reviewSuccess") });
      setComment("");
      setPhotos(null);
      if (photosInputRef.current) {
        photosInputRef.current.value = "";
      }
      await loadReviews(experienceId);
    } catch (err: any) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const hasVisited = experienceId !== null ? hasVisitedExperience(experienceId) : false;
  const hasAlreadyReviewed =
    currentUserId !== null &&
    reviewsData.reviews.some((rev) => Number(rev.touristId) === currentUserId);

  return {
    reviewsData,
    rating,
    setRating,
    comment,
    setComment,
    ecoVerified,
    setEcoVerified,
    photos,
    setPhotos,
    photosInputRef,
    message,
    submitting,
    hasVisited,
    hasAlreadyReviewed,
    handleSubmit,
  };
}
