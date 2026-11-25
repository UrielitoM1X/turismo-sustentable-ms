import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, MessageSquarePlus, Star } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useCatalog } from "../../../context/CatalogContext";
import { useModals } from "../../../context/ModalContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import ExperienceCard from "../../catalog/components/ExperienceCard";
import { usePlaceDetail } from "../hooks/usePlaceDetail";

export default function PlaceDetailPage() {
  const { categorySlug, placeSlug } = useParams<{
    categorySlug: string;
    placeSlug: string;
  }>();
  const { t, lang, formatCategory } = useLanguage();
  const navigate = useNavigate();
  const { canReserve } = useAuth();
  const { isFavorite, toggleFavorite } = useCatalog();
  const { openCheckout, openDetail } = useModals();

  const {
    category,
    placeName,
    matchingExperiences,
    activeExperience,
    setSelectedExpId,
    reviewsData,
    loadingReviews,
    ratingBars,
    visitorPhotos,
  } = usePlaceDetail(categorySlug, placeSlug);

  return (
    <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-8 px-4 lg:px-12 flex justify-center">
      <div className="w-full max-w-7xl space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Left column: Verified reviews from social-service */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <Link
                to={`${ROUTES.RECOMMENDATIONS}/${category.slug}`}
                className="text-[#3B523E] dark:text-[#A5B29A] hover:text-[#C81D77] transition-colors"
                title={t("recs.backToCategory")}
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="font-serif text-2xl text-[#1E201D] dark:text-white">
                {t("recs.place.reviewsTitle")}
              </h1>
            </div>

            <h2 className="text-xl text-[#3B523E] dark:text-[#D1D5CD] mb-4 font-bold">
              {placeName}
            </h2>

            <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 mb-8 flex items-center gap-8 shadow-sm border border-transparent dark:border-white/5">
              <div className="text-center">
                <span className="font-serif text-4xl sm:text-5xl text-[#1E201D] dark:text-white block font-bold">
                  {reviewsData.total_reviews > 0
                    ? Number(reviewsData.average_rating).toFixed(1)
                    : t("recs.place.newLabel")}
                </span>
                <div className="flex text-[#728C69] dark:text-[#A5B29A] my-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-3.5 h-3.5"
                      fill={
                        star <= Math.round(reviewsData.average_rating || 0)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#8C9287] dark:text-[#9EA399]">
                  {t("recs.place.verifiedReviews", { count: reviewsData.total_reviews })}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                {ratingBars.map((bar) => (
                  <div
                    key={bar.stars}
                    className="flex items-center gap-2 text-xs text-[#63665E] dark:text-[#A5B29A]"
                  >
                    <span className="w-2">{bar.stars}</span>
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <div className="flex-1 h-1.5 bg-[#E3E5D8] dark:bg-[#3D453F] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#728C69] dark:bg-[#85A07A] rounded-full transition-all"
                        style={{ width: `${bar.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#8C9287] w-6 text-right">{bar.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {visitorPhotos.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[#1E201D] dark:text-white mb-3">
                  {t("recs.place.visitorPhotos", { count: visitorPhotos.length })}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {visitorPhotos.map((photoUrl, idx) => (
                    <a
                      key={idx}
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-transparent dark:border-white/10"
                    >
                      <img
                        src={photoUrl}
                        alt={`Visitor ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-sm font-medium text-[#1E201D] dark:text-white mb-4">
              {t("recs.place.commentsTitle", { count: reviewsData.total_reviews })}
            </h3>

            {loadingReviews ? (
              <div className="space-y-4 animate-pulse mb-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-white dark:bg-[#2A312C] rounded-3xl" />
                ))}
              </div>
            ) : reviewsData.reviews.length === 0 ? (
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 text-center mb-6 border border-dashed border-[#8C9287]/40">
                <p className="text-xs text-[#8C9287] mb-2">{t("recs.place.noReviews")}</p>
                <p className="text-[11px] text-[#728C69]">{t("recs.place.firstReviewHint")}</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {reviewsData.reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="bg-white dark:bg-[#2A312C] rounded-3xl p-5 shadow-sm border border-transparent dark:border-white/5"
                  >
                    <div className="flex gap-3 mb-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#728C69]/20 text-[#728C69] dark:text-[#A5B29A] flex items-center justify-center font-serif text-sm font-bold flex-shrink-0">
                        T{rev.touristId}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1E201D] dark:text-white">
                          {t("detail.touristLabel", { id: rev.touristId })}
                        </p>
                        {rev.createdAt && (
                          <p className="text-[10px] text-[#8C9287] dark:text-[#9EA399]">
                            {new Date(rev.createdAt).toLocaleDateString(
                              lang === "es" ? "es-MX" : "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            )}
                          </p>
                        )}
                        <div className="flex text-[#728C69] dark:text-[#A5B29A] mt-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className="w-3 h-3"
                              fill={i <= rev.rating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#4A4D46] dark:text-[#D1D5CD] leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeExperience && (
              <button
                type="button"
                onClick={() => openDetail(activeExperience)}
                className="w-full border-2 border-[#728C69] text-[#728C69] dark:border-[#85A07A] dark:text-[#85A07A] rounded-full py-3 flex justify-center items-center gap-2 hover:bg-[#728C69]/10 transition-colors text-xs font-semibold"
              >
                <MessageSquarePlus className="w-4 h-4" />
                {t("recs.place.writeReview")}
              </button>
            )}
          </div>

          {/* Right column: Destination sustainability overview & verified booking CTA */}
          <div className="flex flex-col">
            <h2 className="font-serif text-2xl text-[#1E201D] dark:text-white mb-6">
              {t("recs.place.bookingTitle")}
            </h2>

            <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] overflow-hidden mb-6 shadow-sm border border-transparent dark:border-white/5">
              <div className="w-full h-36 bg-[#B4CBB0] relative">
                <svg
                  viewBox="0 0 400 120"
                  className="w-full h-full object-cover"
                  preserveAspectRatio="none"
                >
                  <circle cx="320" cy="40" r="20" fill="#F4E6B4" />
                  <polygon points="0,120 150,50 350,120" fill="#758C6E" />
                  <polygon points="100,120 280,70 450,120" fill="#586E52" />
                  <polygon points="50,120 200,90 300,120" fill="#3D4B38" />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-[#8C9287] dark:text-[#A5B29A] uppercase">
                    {t("recs.place.sustainabilityLevel")}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <React.Fragment key={i}>
                        <img
                          src="/hoja.svg"
                          alt=""
                          className="w-3 h-3 opacity-80 dark:hidden"
                        />
                        <img
                          src="/hoja_oscura.svg"
                          alt=""
                          className="w-3 h-3 hidden dark:block"
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <h3 className="font-serif text-3xl text-[#1E201D] dark:text-white font-bold">
                  {placeName}
                </h3>
                <p className="text-[#8C9287] dark:text-[#9EA399] text-xs italic font-serif mt-1">
                  {t("recs.place.tagline")}
                </p>
              </div>
            </div>

            {activeExperience ? (
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm border border-transparent dark:border-white/5 space-y-5">
                {matchingExperiences.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium block text-muted-foreground">
                      {t("recs.place.selectExperience")}
                    </label>
                    <select
                      value={activeExperience.id}
                      onChange={(e) => setSelectedExpId(Number(e.target.value))}
                      className="w-full bg-[#F4F1EA] dark:bg-[#1E2420] rounded-xl px-3.5 h-11 text-xs font-medium"
                    >
                      {matchingExperiences.map((exp) => (
                        <option key={exp.id} value={exp.id}>
                          {exp.title} · ${exp.price} MXN
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#728C69]">
                    {formatCategory(activeExperience.category)} · {activeExperience.borough_cdmx}
                  </span>
                  <h4 className="font-serif text-xl font-bold">{activeExperience.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activeExperience.sustainable_practices}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-[#F4F1EA] dark:bg-[#1E2420] rounded-2xl p-4 text-center text-xs">
                  <div>
                    <span className="block text-[10px] text-muted-foreground">
                      {t("card.from")}
                    </span>
                    <span className="font-bold text-sm">
                      ${activeExperience.price} {t("common.mxn")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground">
                      {t("recs.place.duration")}
                    </span>
                    <span className="font-bold text-sm">
                      {t("detail.minutes", { min: activeExperience.duration_minutes })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground">
                      {t("recs.place.capacity")}
                    </span>
                    <span className="font-bold text-sm">
                      {t("detail.maxCap", { cap: activeExperience.max_capacity })}
                    </span>
                  </div>
                </div>

                {canReserve ? (
                  <button
                    type="button"
                    onClick={() => openCheckout(activeExperience)}
                    className="w-full bg-[#C81D77] hover:bg-[#A91864] text-white font-semibold rounded-2xl py-4 transition-colors flex justify-center items-center gap-2 shadow-md text-sm"
                  >
                    {t("recs.place.continueBooking")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openDetail(activeExperience)}
                    className="w-full bg-[#728C69] hover:bg-[#5B7153] text-white font-semibold rounded-2xl py-4 transition-colors text-sm"
                  >
                    {t("card.viewDetail")}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-center shadow-sm space-y-4">
                <Compass className="w-10 h-10 text-[#728C69] mx-auto" />
                <p className="text-sm text-muted-foreground">{t("recs.place.noMatchingExp")}</p>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.EXPLORE)}
                  className="bg-[#728C69] hover:bg-[#5B7153] text-white text-xs font-semibold px-6 py-3 rounded-full"
                >
                  {t("bookings.exploreCta")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related verified experiences in this category/spot */}
        {matchingExperiences.length > 0 && (
          <section className="pt-4 border-t border-border/60">
            <h3 className="font-serif text-2xl mb-5">{t("recs.place.relatedTitle")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingExperiences.slice(0, 6).map((exp) => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  isFavorite={isFavorite(exp.id)}
                  canReserve={canReserve}
                  onToggleFavorite={toggleFavorite}
                  onReserve={openCheckout}
                  onViewDetail={openDetail}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
