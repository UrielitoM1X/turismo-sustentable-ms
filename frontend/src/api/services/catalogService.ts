import { httpRequest } from '../httpClient';

export interface Experience {
    id: number;
    provider_id: number;
    title: string;
    category: string;
    borough_cdmx: string;
    duration_minutes: number;
    price: number;
    max_capacity: number;
    pet_friendly: boolean;
    accessible: boolean;
}

export interface PendingAudit {
    id: number;
    provider_id: number;
    business_name: string;
    category: string;
    description: string;
    created_at: string;
}

export const catalogService = {
    // Buscar experiencias activas aplicando filtros opcionales
    async searchExperiences(filters: {
        q?: string;
        category?: string;
        borough?: string;
        pet_friendly?: boolean;
        accessible?: boolean;
    } = {}): Promise<Experience[]> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return httpRequest<Experience[]>(`/api/catalog/experiences/${queryString}`);
    },

    // Subir documentos PDF y fotografias de evidencia ambiental como proveedor
    async submitAuditEvidence(
        businessName: string,
        category: string,
        description: string,
        files: File[]
    ): Promise<{ audit_id: number; status: string }> {
        const formData = new FormData();
        formData.append('business_name', businessName);
        formData.append('category', category);
        formData.append('description', description);
        files.forEach((file) => formData.append('files', file));

        return httpRequest('/api/catalog/audits/submit', {
            method: 'POST',
            body: formData,
        });
    },

    // Listar auditorias pendientes para el panel del administrador
    async getPendingAudits(category?: string): Promise<PendingAudit[]> {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return httpRequest<PendingAudit[]>(`/api/catalog/audits/pending${query}`);
    },

    // Emitir aprobacion o rechazo tecnico sobre una auditoria
    async resolveAudit(auditId: number, decision: 'APPROVED' | 'REJECTED', notes?: string): Promise<void> {
        await httpRequest(`/api/catalog/audits/${auditId}/decision`, {
            method: 'PATCH',
            body: JSON.stringify({ decision, reviewer_notes: notes }),
        });
    },
};