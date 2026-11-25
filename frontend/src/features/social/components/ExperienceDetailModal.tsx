import React, { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useModals } from "../../../context/ModalContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useExperienceChat } from "../hooks/useExperienceChat";
import { useExperienceReviews } from "../hooks/useExperienceReviews";

export default function ExperienceDetailModal() {
  const { t } = useLanguage();
  const { session, isTourist, canReserve } = useAuth();
  const { detailExperience, closeDetail, openCheckout } = useModals();
  const [detailTab, setDetailTab] = useState<"reviews" | "chat">("reviews");

  const reviews = useExperienceReviews(detailExperience?.id ?? null);
  const chat = useExperienceChat(detailExperience);

  useEffect(() => {
    if (detailExperience) {
      setDetailTab("reviews");
    }
  }, [detailExperience]);

  if (!detailExperience) return null;

  const startCheckout = () => {
    const chosen = detailExperience;
    closeDetail();
    openCheckout(chosen);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeDetail}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F2EFE9] dark:bg-[#18201C] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#728C69] uppercase">
            <ShieldCheck className="w-4 h-4" /> {t("detail.verifiedBadge")}
          </span>
          {reviews.reviewsData.total_reviews > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {reviews.reviewsData.average_rating} ({reviews.reviewsData.total_reviews})
            </span>
          )}
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl mb-3">{detailExperience.title}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {detailExperience.sustainable_practices}
        </p>

        <div className="grid grid-cols-3 gap-3 bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl text-xs mb-6">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#728C69]" /> {detailExperience.borough_cdmx}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#728C69]" />{" "}
            {t("detail.minutes", { min: detailExperience.duration_minutes })}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#728C69]" />{" "}
            {t("detail.maxCap", { cap: detailExperience.max_capacity })}
          </div>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div>
            <span className="text-xs text-muted-foreground block">
              {t("detail.pricePerPerson")}
            </span>
            <span className="text-xl font-bold">
              ${detailExperience.price} {t("common.mxn")}
            </span>
          </div>
          {canReserve ? (
            <button
              onClick={startCheckout}
              className="bg-[#C81D77] hover:bg-[#A91864] text-white text-sm font-medium px-6 py-3 rounded-full"
            >
              {t("detail.reserveNow")}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground bg-[#F2EFE9] dark:bg-[#18201C] px-4 py-2 rounded-full">
              {t("detail.touristOnlyReserve")}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-5 mb-4">
          <button
            onClick={() => setDetailTab("reviews")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              detailTab === "reviews"
                ? "bg-[#728C69] text-white"
                : "bg-[#F2EFE9] dark:bg-[#18201C]"
            }`}
          >
            {t("detail.tabReviews", { count: reviews.reviewsData.total_reviews })}
          </button>
          {isTourist && (
            <button
              onClick={() => setDetailTab("chat")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                detailTab === "chat"
                  ? "bg-[#728C69] text-white"
                  : "bg-[#F2EFE9] dark:bg-[#18201C]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t("detail.tabChat")}
            </button>
          )}
        </div>

        {detailTab === "reviews" ? (
          <div className="space-y-5">
            {session.token && isTourist && (
              <>
                {reviews.hasAlreadyReviewed ? (
                  <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl text-xs flex items-center gap-2.5 text-[#3B523E] dark:text-[#A5B29A]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#728C69]" />
                    <span>{t("detail.alreadyReviewed")}</span>
                  </div>
                ) : !reviews.hasVisited ? (
                  <div className="bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Lock className="w-4 h-4 shrink-0 text-[#C81D77]" />
                      <span>{t("detail.mustVisitNotice")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={startCheckout}
                      className="shrink-0 bg-[#728C69] text-white px-3 py-1.5 rounded-xl font-semibold"
                    >
                      {t("card.reserve")}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={reviews.handleSubmit}
                    className="bg-[#F2EFE9] dark:bg-[#18201C] p-4 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold">{t("detail.shareExperience")}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => reviews.setRating(star)}
                            className="p-0.5"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= reviews.rating
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      required
                      rows={2}
                      placeholder={t("detail.reviewPlaceholder")}
                      value={reviews.comment}
                      onChange={(e) => reviews.setComment(e.target.value)}
                      className="w-full bg-white dark:bg-[#2A312C] rounded-xl p-3 text-xs"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reviews.ecoVerified}
                          onChange={(e) => reviews.setEcoVerified(e.target.checked)}
                        />
                        <span>{t("detail.confirmEco")}</span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#728C69] font-medium">
                        <Camera className="w-3.5 h-3.5" />
                        <span>
                          {reviews.photos?.length
                            ? t("detail.photosReady", { count: reviews.photos.length })
                            : t("detail.attachPhotos")}
                        </span>
                        <input
                          ref={reviews.photosInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => reviews.setPhotos(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {reviews.message && (
                      <p
                        className={`text-xs ${
                          reviews.message.type === "ok" ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {reviews.message.text}
                      </p>
                    )}

                    <button
                      disabled={reviews.submitting}
                      type="submit"
                      className="bg-[#728C69] hover:bg-[#5B7153] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                    >
                      {reviews.submitting
                        ? t("detail.publishingReview")
                        : t("detail.publishReview")}
                    </button>
                  </form>
                )}
              </>
            )}

            {reviews.reviewsData.reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("detail.noReviews")}</p>
            ) : (
              <div className="space-y-3">
                {reviews.reviewsData.reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-4 rounded-2xl bg-[#F2EFE9]/70 dark:bg-[#18201C]/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {t("detail.touristLabel", { id: rev.touristId })}
                        </span>
                        {rev.ecologicalComplianceVerified && (
                          <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                            {t("detail.ecoVerifiedTag")}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-amber-600">★ {rev.rating}/5</span>
                    </div>
                    <p className="text-xs text-foreground">{rev.comment}</p>
                    {Array.isArray(rev.photoKeys) && rev.photoKeys.length > 0 && (
                      <div className="pt-1.5">
                        <p className="text-[10px] text-[#728C69] font-medium mb-1.5">
                          {t("detail.photoProof", { count: rev.photoKeys.length })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {rev.photoKeys.map((_, photoIdx) => {
                            const photoUrl = `/api/social/reviews/${rev._id}/photos/${photoIdx}`;
                            return (
                              <a
                                key={photoIdx}
                                href={photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-16 h-16 rounded-xl overflow-hidden border border-border bg-white dark:bg-[#2A312C]"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Proof ${photoIdx + 1}`}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!session.token ? (
              <p className="text-xs text-muted-foreground">{t("detail.chatLoginNotice")}</p>
            ) : (
              <>
                <div className="bg-[#F2EFE9] dark:bg-[#18201C] rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                  {chat.history.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("detail.chatEmpty")}</p>
                  ) : (
                    chat.history.map((m, idx) => (
                      <div
                        key={m._id || idx}
                        className="bg-white dark:bg-[#2A312C] rounded-xl p-2.5 text-xs"
                      >
                        <span className="font-bold text-[#728C69] block mb-0.5">
                          {m.senderRole === "PROVIDER"
                            ? t("detail.coopLabel")
                            : t("detail.touristLabel", { id: m.senderId })}
                        </span>
                        <span>{m.content}</span>
                      </div>
                    ))
                  )}
                </div>

                {chat.error && <p className="text-xs text-red-600">{chat.error}</p>}

                <form onSubmit={chat.handleSend} className="flex gap-2">
                  <input
                    required
                    value={chat.text}
                    onChange={(e) => chat.setText(e.target.value)}
                    placeholder={t("detail.chatPlaceholder")}
                    className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-3 h-10 text-xs"
                  />
                  <button
                    disabled={chat.sending}
                    type="submit"
                    className="bg-[#C81D77] text-white px-4 rounded-xl text-xs font-medium flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t("common.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
