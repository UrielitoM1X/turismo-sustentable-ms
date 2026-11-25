import { httpRequest } from "../httpClient";

export type GuestType = "adults" | "children" | "seniors" | "students";

export interface GuestBreakdown {
  adults: number;
  children: number;
  seniors: number;
  students: number;
}

export const GUEST_RATE_MULTIPLIERS: Record<GuestType, number> = {
  adults: 1.0,
  children: 0.5,
  seniors: 0.7,
  students: 0.8,
};

export interface PreBookingPayload {
  experience_id: number;
  activity_date: string;
  guests_count: number;
  guest_breakdown: GuestBreakdown;
  accessibility_notes?: string;
  unit_price: number;
  max_ecological_capacity: number;
}

export interface PreBookingResponse {
  booking_id: number;
  guests_count?: number;
  guest_breakdown?: GuestBreakdown;
  base_amount?: number;
  impact_contribution?: number;
  total_amount?: number;
  status?: string;
}

export interface PaymentResponse {
  booking_id: number;
  status: string;
  access_code: string;
  total_paid?: number;
  guest_breakdown?: GuestBreakdown;
}

export interface TouristBooking {
  id: number;
  experience_id: number;
  activity_date: string;
  guests_count: number;
  guest_breakdown?: GuestBreakdown;
  accessibility_notes?: string | null;
  total_amount: number;
  impact_contribution?: number;
  status: string;
  access_code: string | null;
}

export interface PaymentConfigResponse {
  provider: "stripe" | "simulated";
  stripe_enabled: boolean;
  test_mode: boolean;
  currency: string;
}

export interface StripeCheckoutResponse {
  mode: "stripe" | "simulated";
  booking_id: number;
  session_id: string | null;
  checkout_url: string | null;
}

export const bookingService = {
  async getPaymentConfig(): Promise<PaymentConfigResponse> {
    return httpRequest<PaymentConfigResponse>("/api/bookings/reservations/payment-config");
  },

  async createPreBooking(payload: PreBookingPayload): Promise<PreBookingResponse> {
    return httpRequest<PreBookingResponse>("/api/bookings/reservations/reserve", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async createStripeCheckoutSession(
    bookingId: number,
    frontendOrigin?: string
  ): Promise<StripeCheckoutResponse> {
    return httpRequest<StripeCheckoutResponse>(
      "/api/bookings/reservations/stripe/checkout-session",
      {
        method: "POST",
        body: JSON.stringify({
          booking_id: bookingId,
          frontend_origin: frontendOrigin,
        }),
      }
    );
  },

  async verifyStripeSession(
    bookingId: number,
    sessionId: string
  ): Promise<PaymentResponse> {
    return httpRequest<PaymentResponse>("/api/bookings/reservations/stripe/verify", {
      method: "POST",
      body: JSON.stringify({
        booking_id: bookingId,
        session_id: sessionId,
      }),
    });
  },

  async confirmPayment(
    bookingId: number,
    paymentMethod: "CARD" | "TRANSFER" | "WALLET" = "CARD",
    simulateFailure = false
  ): Promise<PaymentResponse> {
    return httpRequest<PaymentResponse>("/api/bookings/reservations/pay", {
      method: "POST",
      body: JSON.stringify({
        booking_id: bookingId,
        payment_method: paymentMethod,
        simulate_failure: simulateFailure,
      }),
    });
  },

  async cancelBooking(bookingId: number): Promise<void> {
    await httpRequest(`/api/bookings/reservations/${bookingId}/cancel`, {
      method: "POST",
    });
  },

  async getMyBookings(): Promise<TouristBooking[]> {
    const data = await httpRequest<TouristBooking[]>("/api/bookings/reservations/my-bookings");
    return Array.isArray(data) ? data : [];
  },

  async getFavorites(): Promise<number[]> {
    const res = await httpRequest<{ favorite_experience_ids?: number[] }>(
      "/api/bookings/planning/favorites"
    );
    return Array.isArray(res?.favorite_experience_ids)
      ? res.favorite_experience_ids.map(Number)
      : [];
  },

  async toggleFavorite(experienceId: number): Promise<number[] | null> {
    const res = await httpRequest<{ favorite_experience_ids?: number[] }>(
      `/api/bookings/planning/favorites/${experienceId}`,
      { method: "POST" }
    );
    return Array.isArray(res?.favorite_experience_ids)
      ? res.favorite_experience_ids.map(Number)
      : null;
  },
};
