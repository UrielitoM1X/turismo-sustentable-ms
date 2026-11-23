import { httpRequest } from '../httpClient';

export interface PreBookingResponse {
    booking_id: number;
    base_amount: number;
    impact_contribution: number;
    total_amount: number;
    status: string;
}

export interface PaymentResponse {
    booking_id: number;
    status: string;
    access_code: string;
    total_paid: number;
}

export interface TouristBooking {
    id: number;
    experience_id: number;
    activity_date: string;
    guests_count: number;
    total_amount: number;
    status: string;
    access_code: string | null;
}

export const bookingService = {
    // Generar pre-reserva verificando disponibilidad y cupo ecologico
    async createPreBooking(payload: {
        experience_id: number;
        activity_date: string;
        guests_count: number;
        accessibility_notes?: string;
        unit_price: number;
        max_ecological_capacity: number;
    }): Promise<PreBookingResponse> {
        return httpRequest<PreBookingResponse>('/api/bookings/reservations/reserve', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Confirmar pago o probar flujo de rechazo sin cargo
    async confirmPayment(
        bookingId: number,
        paymentMethod: 'CARD' | 'TRANSFER' | 'WALLET',
        simulateFailure = false
    ): Promise<PaymentResponse> {
        return httpRequest<PaymentResponse>('/api/bookings/reservations/pay', {
            method: 'POST',
            body: JSON.stringify({
                booking_id: bookingId,
                payment_method: paymentMethod,
                simulate_failure: simulateFailure,
            }),
        });
    },

    // Obtener proximas reservas e historial del turista
    async getMyBookings(): Promise<TouristBooking[]> {
        return httpRequest<TouristBooking[]>('/api/bookings/reservations/my-bookings');
    },

    // Alternar experiencia en lista de favoritos
    async toggleFavorite(experienceId: number): Promise<{ experience_id: number; is_favorite: boolean }> {
        return httpRequest(`/api/bookings/planning/favorites/${experienceId}`, {
            method: 'POST',
        });
    },
};