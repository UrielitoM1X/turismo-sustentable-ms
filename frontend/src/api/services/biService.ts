import { httpRequest } from '../httpClient';

export interface BiDailyPoint {
    date: string;
    bookings_count: number;
    revenue: number;
    impact_fund: number;
    tourists: number;
}

export interface BiServiceHealthItem {
    service: string;
    status: 'UP' | 'DEGRADED';
    latency_ms: number | null;
}

export interface BiDashboardSummary {
    kpis: {
        total_bookings: number;
        total_revenue: number;
        total_impact_fund: number;
        total_tourists_mobilized: number;
        avg_ticket?: number;
        avg_group_size?: number;
        avg_impact_per_tourist?: number;
        unique_tourists?: number;
        repeat_tourist_rate?: number;
        active_providers_with_bookings?: number;
        active_experiences_booked?: number;
    };
    by_category: Array<{
        category: string;
        bookings_count: number;
        tourists?: number;
        revenue: number;
        impact_fund?: number;
        revenue_share_pct?: number;
    }>;
    top_providers: Array<{
        provider_id: number;
        bookings_count: number;
        tourists?: number;
        revenue: number;
        impact_fund?: number;
        avg_ticket?: number;
    }>;
    top_experiences?: Array<{
        experience_id: number;
        title: string;
        category: string;
        borough_cdmx: string;
        bookings_count: number;
        tourists: number;
        revenue: number;
        impact_fund: number;
    }>;
    daily_trend?: BiDailyPoint[];
    platform_overview?: {
        total_active_experiences: number;
        total_catalog_providers: number;
        pet_friendly_count: number;
        pet_friendly_pct: number;
        accessible_count: number;
        accessible_pct: number;
        avg_catalog_price: number;
        total_ecological_capacity: number;
        by_borough: Array<{
            borough: string;
            experiences_count: number;
            bookings_count: number;
            revenue: number;
            tourists: number;
        }>;
        catalog_by_category: Array<{
            category: string;
            experiences_count: number;
            avg_price: number;
        }>;
    };
    service_health?: BiServiceHealthItem[];
}

export interface ProviderExperienceMetric {
    experience_id: number;
    title: string;
    category: string;
    borough_cdmx: string;
    is_active: boolean;
    max_capacity: number;
    price: number;
    bookings_count: number;
    tourists: number;
    avg_group_size: number;
    revenue: number;
    impact_fund: number;
    last_booking_at: string | null;
}

export interface ProviderBiSummary {
    provider_id: number;
    kpis: {
        total_bookings: number;
        total_revenue: number;
        total_impact_fund: number;
        total_tourists: number;
        avg_ticket: number;
        avg_group_size: number;
        unique_tourists: number;
    };
    daily_trend: BiDailyPoint[];
    by_experience: ProviderExperienceMetric[];
    by_category: Array<{
        category: string;
        bookings_count: number;
        tourists: number;
        revenue: number;
    }>;
    recent_bookings: Array<{
        booking_id: number;
        experience_id: number;
        category: string;
        guests_count: number;
        total_amount: number;
        impact_contribution: number;
        recorded_at: string | null;
    }>;
}

export const biService = {
    // Obtener indicadores consolidados para el panel administrativo BI
    async getSummary(): Promise<BiDashboardSummary> {
        return httpRequest<BiDashboardSummary>('/api/bi/dashboard/summary');
    },

    // Obtener monitoreo operativo exclusivo del proveedor autenticado
    async getProviderSummary(): Promise<ProviderBiSummary> {
        return httpRequest<ProviderBiSummary>('/api/bi/dashboard/provider');
    },
};
