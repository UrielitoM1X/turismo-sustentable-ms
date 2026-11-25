import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Info, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useBookings } from "../../../context/BookingsContext";
import { useCatalog } from "../../../context/CatalogContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import { formatBreakdownChips } from "../components/CheckoutModal";
import { useStripeReturn } from "../hooks/useStripeReturn";

export default function BookingsPage() {
  const { t, formatStatus } = useLanguage();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { experiences } = useCatalog();
  const { bookings, loading, error, reloadBookings } = useBookings();
  const { banner, dismissBanner } = useStripeReturn();

  useEffect(() => {
    reloadBookings();
  }, [reloadBookings]);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">{t("bookings.title")}</h1>
        <button
          onClick={reloadBookings}
          className="text-xs bg-[#E3E5D8] dark:bg-[#2A312C] px-4 py-2 rounded-full font-medium hover:bg-[#728C69] hover:text-white transition"
        >
          {t("common.refresh")}
        </button>
      </div>

      {banner && (
        <div
          className={`rounded-2xl p-4 text-xs mb-6 flex items-start justify-between gap-3 border ${
            banner.type === "success"
              ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/50"
              : banner.type === "error"
              ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50"
              : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {banner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-medium">{banner.text}</p>
              {banner.accessCode && (
                <p className="font-mono font-bold text-[#728C69] dark:text-[#A5B29A]">
                  {t("bookings.accessCode", { code: banner.accessCode })}
                </p>
              )}
            </div>
          </div>
          {banner.type !== "verifying" && (
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Close"
              className="opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 text-xs mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("bookings.loading")}</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t("bookings.empty", { name: session.name || t("bookings.guest") })}
          </p>
          <button
            onClick={() => navigate(ROUTES.EXPLORE)}
            className="bg-[#C81D77] text-white text-xs font-medium px-5 py-2.5 rounded-full"
          >
            {t("bookings.exploreCta")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const expInfo = experiences.find((e) => Number(e.id) === Number(b.experience_id));
            const st = String(b.status || "").toUpperCase();
            const statusBadgeClass =
              st === "CONFIRMED" || st === "PAID" || st === "COMPLETED"
                ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                : st === "PENDING_PAYMENT"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300";
            const breakdownChips = formatBreakdownChips(b.guest_breakdown, t);

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-[#2A312C] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-mono bg-[#EBE9E0] dark:bg-[#18201C] text-[#3B523E] dark:text-[#A5B29A] px-3 py-1 rounded-full">
                    {t("bookings.accessCode", { code: b.access_code || `TS-${b.id}` })}
                  </span>
                  <h3 className="font-serif text-xl mt-2">
                    {expInfo ? expInfo.title : t("bookings.expTitle", { id: b.experience_id })} ·{" "}
                    {b.activity_date}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("bookings.summary", {
                      guests: b.guests_count,
                      total: b.total_amount,
                    })}
                  </p>
                  {breakdownChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {breakdownChips.map((chip) => (
                        <span
                          key={chip}
                          className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#F2EFE9] dark:bg-[#18201C] text-[#3B523E] dark:text-[#A5B29A]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-center ${statusBadgeClass}`}
                >
                  {formatStatus(b.status)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
