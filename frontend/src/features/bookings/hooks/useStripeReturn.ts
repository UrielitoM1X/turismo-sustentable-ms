import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { bookingService } from "../../../api/services/bookingService";
import { useBookings } from "../../../context/BookingsContext";
import { useLanguage } from "../../../i18n/LanguageContext";

export interface StripeReturnBanner {
  type: "verifying" | "success" | "cancelled" | "error";
  text: string;
  accessCode?: string;
}

export function useStripeReturn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { reloadBookings } = useBookings();
  const { t } = useLanguage();
  const [banner, setBanner] = useState<StripeReturnBanner | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const status = searchParams.get("stripe_status");
    const rawBookingId = searchParams.get("booking_id");
    const sessionId = searchParams.get("session_id");

    if (!status || !rawBookingId || processedRef.current) return;
    processedRef.current = true;

    const bookingId = Number(rawBookingId);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      setSearchParams({}, { replace: true });
      return;
    }

    if (status === "success" && sessionId) {
      setBanner({ type: "verifying", text: t("checkout.stripeVerifying") });
      bookingService
        .verifyStripeSession(bookingId, sessionId)
        .then(async (paid) => {
          await reloadBookings();
          setBanner({
            type: "success",
            text: t("checkout.stripeConfirmed", {
              amount: Number(paid.total_paid ?? 0).toFixed(2),
            }),
            accessCode: paid.access_code,
          });
        })
        .catch((err: any) => {
          setBanner({
            type: "error",
            text: err.message || t("checkout.stripeVerifyError"),
          });
        })
        .finally(() => {
          setSearchParams({}, { replace: true });
        });
      return;
    }

    if (status === "cancelled") {
      bookingService
        .cancelBooking(bookingId)
        .catch(() => {})
        .finally(async () => {
          await reloadBookings();
          setBanner({ type: "cancelled", text: t("checkout.stripeCancelled") });
          setSearchParams({}, { replace: true });
        });
    }
  }, [searchParams, setSearchParams, reloadBookings, t]);

  return {
    banner,
    dismissBanner: () => setBanner(null),
  };
}
