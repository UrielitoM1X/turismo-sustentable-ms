import { httpRequest } from '../httpClient';

export interface BiDashboardSummary {
    kpis: {
        total_bookings: number;
        total_revenue: number;
        total_impact_fund: number;
        total_tourists_mobilized: number;
    };
    by_category: Array<{
        category: string;
        bookings_count: number;
        revenue: number;
    }>;
    top_providers: Array<{
        provider_id: number;
        bookings_count: number;
        revenue: number;
    }>;
}

export const biService = {
    // Obtener indicadores consolidados para el panel administrativo BI
    async getSummary(): Promise<BiDashboardSummary> {
        return httpRequest<BiDashboardSummary>('/api/bi/dashboard/summary');
    },
};