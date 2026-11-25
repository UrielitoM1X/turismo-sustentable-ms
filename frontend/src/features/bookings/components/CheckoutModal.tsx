import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Leaf } from "lucide-react";
import { GuestBreakdown } from "../../../api/services/bookingService";
import { useModals } from "../../../context/ModalContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";
import { useCheckout } from "../hooks/useCheckout";
import GuestBreakdownSelector from "./GuestBreakdownSelector";

export function formatBreakdownChips(
  breakdown: GuestBreakdown | undefined,
  t: (key: string, params?: Record<string, string | number>) => string
): string[] {
  if (!breakdown) return [];
  const chips: string[] = [];
  if (breakdown.adults > 0) chips.push(`${breakdown.adults} ${t("checkout.guestAdults")}`);
  if (breakdown.children > 0) chips.push(`${breakdown.children} ${t("checkout.guestChildren")}`);
  if (breakdown.seniors > 0) chips.push(`${breakdown.seniors} ${t("checkout.guestSeniors")}`);
  if (breakdown.students > 0) chips.push(`${breakdown.students} ${t("checkout.guestStudents")}`);
  return chips;
}

export default function CheckoutModal() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { checkoutExperience, closeCheckout } = useModals();

  const {
    bookingDate,
    setBookingDate,
    guestBreakdown,
    totalGuests,
    incrementGuest,
    decrementGuest,
    accessNotes,
    setAccessNotes,
    loading,
    receipt,
    error,
    pendingBookingId,
    stripeEnabled,
    stripeTestMode,
    maxCap,
    baseAmount,
    impactAmount,
    totalAmount,
    todayLocal,
    handleCancel,
    handlePay,
  } = useCheckout(checkoutExperience, closeCheckout);

  if (!checkoutExperience) return null;

  const receiptChips = receipt ? formatBreakdownChips(receipt.guest_breakdown, t) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] max-w-md w-full p-6 sm:p-7 shadow-xl my-6 max-h-[92vh] overflow-y-auto">
        {receipt ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl">{t("checkout.confirmedTitle")}</h2>
            <p className="text-xs text-muted-foreground">{receipt.title}</p>
            <div className="bg-[#F2EFE9] dark:bg-[#18201C] rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("checkout.ecoPassLabel")}
              </span>
              <p className="font-mono text-xl font-bold text-[#728C69]">
                {receipt.access_code}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("checkout.receiptDateGuests", {
                  date: receipt.date,
                  guests: receipt.guests,
                })}
              </p>
              {receiptChips.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {receiptChips.map((chip) => (
                    <span
                      key={chip}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white dark:bg-[#2A312C] text-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#728C69] font-medium pt-1">
                {t("checkout.receiptImpact", {
                  amount: Number(receipt.impact_contribution ?? 0).toFixed(2),
                })}
              </p>
              <p className="text-xs font-bold">
                {t("checkout.receiptTotal", {
                  amount: Number(receipt.total ?? 0).toFixed(2),
                })}
              </p>
            </div>
            <button
              onClick={() => {
                closeCheckout();
                navigate(ROUTES.BOOKINGS);
              }}
              className="w-full bg-[#728C69] text-white rounded-xl h-12 text-sm font-medium"
            >
              {t("checkout.viewBookings")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#728C69] uppercase">
                <Leaf className="w-4 h-4" /> {t("checkout.badge")}
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  stripeEnabled
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                    : "bg-[#F2EFE9] dark:bg-[#18201C] text-muted-foreground"
                }`}
              >
                {stripeEnabled
                  ? stripeTestMode
                    ? t("checkout.stripeTestBadge")
                    : t("checkout.stripeLiveBadge")
                  : t("checkout.simulatedBadge")}
              </span>
            </div>
            <h2 className="font-serif text-2xl mb-1">{checkoutExperience.title}</h2>
            <p className="text-xs text-muted-foreground mb-5">
              {t("checkout.maxCap", {
                borough: checkoutExperience.borough_cdmx,
                cap: maxCap,
              })}
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {pendingBookingId && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs mb-4">
                {t("checkout.pendingHold", { id: pendingBookingId })}
              </div>
            )}

            <div className="space-y-4 mb-6 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">
                  {t("checkout.visitDate")}
                </label>
                <input
                  type="date"
                  disabled={loading || Boolean(pendingBookingId)}
                  value={bookingDate}
                  min={todayLocal}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 disabled:opacity-60"
                />
              </div>

              <GuestBreakdownSelector
                breakdown={guestBreakdown}
                unitPrice={checkoutExperience.price}
                totalGuests={totalGuests}
                maxCap={maxCap}
                disabled={loading || Boolean(pendingBookingId)}
                onIncrement={incrementGuest}
                onDecrement={decrementGuest}
              />

              <div>
                <label className="block text-xs font-medium mb-1">
                  {t("checkout.accessNotes")}
                </label>
                <input
                  disabled={loading || Boolean(pendingBookingId)}
                  placeholder={t("checkout.accessNotesPlaceholder")}
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                  className="w-full bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 disabled:opacity-60"
                />
              </div>

              <div className="pt-3 border-t border-border space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {t("checkout.subtotal", {
                      count: totalGuests,
                      plural: totalGuests === 1 ? "" : "s",
                    })}
                  </span>
                  <span>
                    ${baseAmount.toFixed(2)} {t("common.mxn")}
                  </span>
                </div>
                <div className="flex justify-between text-[#728C69]">
                  <span>{t("checkout.impactFund")}</span>
                  <span>
                    ${impactAmount.toFixed(2)} {t("common.mxn")}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>{t("checkout.total")}</span>
                  <span>
                    ${totalAmount.toFixed(2)} {t("common.mxn")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={handleCancel}
                className="flex-1 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl h-11 text-sm font-medium disabled:opacity-50"
              >
                {pendingBookingId ? t("checkout.cancelBooking") : t("common.cancel")}
              </button>
              <button
                disabled={loading || totalGuests < 1}
                onClick={handlePay}
                className="flex-1 bg-[#C81D77] hover:bg-[#A91864] text-white rounded-xl h-11 text-sm font-medium disabled:opacity-50"
              >
                {loading
                  ? t("common.processing")
                  : pendingBookingId
                  ? t("checkout.retryPay")
                  : stripeEnabled
                  ? t("checkout.payWithStripe")
                  : t("checkout.confirmPay")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
