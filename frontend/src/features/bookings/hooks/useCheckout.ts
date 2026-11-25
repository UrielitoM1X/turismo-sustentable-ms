import { useEffect, useState } from "react";
import {
  bookingService,
  GUEST_RATE_MULTIPLIERS,
  GuestBreakdown,
  GuestType,
  PaymentResponse,
} from "../../../api/services/bookingService";
import { Experience } from "../../../api/services/catalogService";
import { useBookings } from "../../../context/BookingsContext";
import { getLocalDateString } from "../../../shared/utils/format";

export interface BookingReceipt extends PaymentResponse {
  title: string;
  date: string;
  guests: number;
  guest_breakdown: GuestBreakdown;
  impact_contribution: number;
  total: number;
}

function createInitialBreakdown(maxCapacity: number): GuestBreakdown {
  return {
    adults: Math.min(2, Math.max(1, maxCapacity)),
    children: 0,
    seniors: 0,
    students: 0,
  };
}

export function useCheckout(experience: Experience | null, onClose: () => void) {
  const { reloadBookings } = useBookings();

  const [bookingDate, setBookingDate] = useState(() => getLocalDateString(1));
  const [guestBreakdown, setGuestBreakdown] = useState<GuestBreakdown>(() =>
    createInitialBreakdown(2)
  );
  const [accessNotes, setAccessNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [error, setError] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [pendingImpact, setPendingImpact] = useState<number | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeTestMode, setStripeTestMode] = useState(true);

  useEffect(() => {
    if (!experience) return;
    setReceipt(null);
    setError("");
    setPendingBookingId(null);
    setPendingImpact(null);
    setAccessNotes("");
    setBookingDate(getLocalDateString(1));
    setGuestBreakdown(createInitialBreakdown(experience.max_capacity || 1));

    bookingService
      .getPaymentConfig()
      .then((cfg) => {
        setStripeEnabled(Boolean(cfg.stripe_enabled));
        setStripeTestMode(Boolean(cfg.test_mode));
      })
      .catch(() => {
        setStripeEnabled(false);
      });
  }, [experience]);

  const maxCap = Math.max(1, experience?.max_capacity || 1);
  const totalGuests =
    guestBreakdown.adults +
    guestBreakdown.children +
    guestBreakdown.seniors +
    guestBreakdown.students;
  const remainingSpots = Math.max(0, maxCap - totalGuests);

  const baseAmount = experience
    ? Number(
        (
          experience.price * GUEST_RATE_MULTIPLIERS.adults * guestBreakdown.adults +
          experience.price * GUEST_RATE_MULTIPLIERS.children * guestBreakdown.children +
          experience.price * GUEST_RATE_MULTIPLIERS.seniors * guestBreakdown.seniors +
          experience.price * GUEST_RATE_MULTIPLIERS.students * guestBreakdown.students
        ).toFixed(2)
      )
    : 0;
  const impactAmount = Number((baseAmount * 0.05).toFixed(2));
  const totalAmount = Number((baseAmount + impactAmount).toFixed(2));

  const incrementGuest = (type: GuestType) => {
    if (totalGuests >= maxCap) return;
    setGuestBreakdown((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const decrementGuest = (type: GuestType) => {
    if (guestBreakdown[type] <= 0 || totalGuests <= 1) return;
    setGuestBreakdown((prev) => ({ ...prev, [type]: prev[type] - 1 }));
  };

  const handleCancel = async () => {
    if (loading) return;
    if (pendingBookingId) {
      try {
        await bookingService.cancelBooking(pendingBookingId);
        await reloadBookings();
      } catch {
        // Close modal anyway if the temporary hold already expired
      }
    }
    setPendingBookingId(null);
    setPendingImpact(null);
    setError("");
    onClose();
  };

  const handlePay = async () => {
    if (!experience || totalGuests < 1) return;
    setLoading(true);
    setError("");

    try {
      let bookingIdToPay = pendingBookingId;
      let impactContribution = pendingImpact;
      let preTotalAmount: number | null = null;

      if (!bookingIdToPay) {
        const pre = await bookingService.createPreBooking({
          experience_id: experience.id,
          activity_date: bookingDate,
          guests_count: totalGuests,
          guest_breakdown: guestBreakdown,
          accessibility_notes: accessNotes || undefined,
          unit_price: experience.price,
          max_ecological_capacity: experience.max_capacity,
        });
        bookingIdToPay = pre.booking_id;
        impactContribution =
          typeof pre.impact_contribution === "number" ? pre.impact_contribution : null;
        preTotalAmount = typeof pre.total_amount === "number" ? pre.total_amount : null;
        setPendingBookingId(bookingIdToPay);
        setPendingImpact(impactContribution);
      }

      if (stripeEnabled) {
        const checkoutSession = await bookingService.createStripeCheckoutSession(
          bookingIdToPay,
          window.location.origin
        );
        if (checkoutSession.mode === "stripe" && checkoutSession.checkout_url) {
          window.location.assign(checkoutSession.checkout_url);
          return;
        }
      }

      const paid = await bookingService.confirmPayment(bookingIdToPay, "CARD", false);

      const finalImpact = impactContribution ?? impactAmount;
      const finalTotal =
        typeof paid.total_paid === "number"
          ? paid.total_paid
          : preTotalAmount ?? Number((baseAmount + finalImpact).toFixed(2));

      setPendingBookingId(null);
      setPendingImpact(null);
      setReceipt({
        ...paid,
        title: experience.title,
        date: bookingDate,
        guests: totalGuests,
        guest_breakdown: paid.guest_breakdown || guestBreakdown,
        impact_contribution: finalImpact,
        total: finalTotal,
      });
      await reloadBookings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    bookingDate,
    setBookingDate,
    guestBreakdown,
    totalGuests,
    remainingSpots,
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
    todayLocal: getLocalDateString(0),
    handleCancel,
    handlePay,
  };
}
