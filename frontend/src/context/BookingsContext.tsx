import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { bookingService, TouristBooking } from "../api/services/bookingService";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "./AuthContext";

interface BookingsContextValue {
  bookings: TouristBooking[];
  loading: boolean;
  error: string;
  reloadBookings: () => Promise<void>;
  hasVisitedExperience: (experienceId: number) => boolean;
  totalImpactFund: number;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "PAID", "COMPLETED"]);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const { session, isTourist } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<TouristBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reloadBookings = useCallback(async () => {
    if (!session.token || !isTourist) {
      setBookings([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const list = await bookingService.getMyBookings();
      setBookings(list);
    } catch (err: any) {
      setError(err.message || t("bookings.loadError"));
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [session.token, isTourist, t]);

  useEffect(() => {
    if (session.token && isTourist) {
      reloadBookings();
    } else {
      setBookings([]);
      setError("");
    }
  }, [session.token, isTourist, reloadBookings]);

  const hasVisitedExperience = useCallback(
    (experienceId: number) =>
      bookings.some(
        (b) =>
          Number(b.experience_id) === Number(experienceId) &&
          CONFIRMED_STATUSES.has(String(b.status).toUpperCase())
      ),
    [bookings]
  );

  const totalImpactFund = useMemo(() => {
    const sum = bookings.reduce((acc, b) => {
      const status = String(b.status || "").toUpperCase();
      if (!CONFIRMED_STATUSES.has(status)) return acc;
      if (typeof b.impact_contribution === "number") {
        return acc + b.impact_contribution;
      }
      const total = Number(b.total_amount || 0);
      return acc + Number(((total / 1.05) * 0.05).toFixed(2));
    }, 0);
    return Number(sum.toFixed(2));
  }, [bookings]);

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      loading,
      error,
      reloadBookings,
      hasVisitedExperience,
      totalImpactFund,
    }),
    [bookings, loading, error, reloadBookings, hasVisitedExperience, totalImpactFund]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings(): BookingsContextValue {
  const ctx = useContext(BookingsContext);
  if (!ctx) {
    throw new Error("useBookings must be used inside BookingsProvider");
  }
  return ctx;
}
