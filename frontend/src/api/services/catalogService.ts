import { fetchAuthorizedBlob, httpRequest } from "../httpClient";

export interface Experience {
  id: number;
  provider_id?: number;
  title: string;
  description?: string;
  category: string;
  borough_cdmx: string;
  duration_minutes: number;
  price: number;
  max_capacity: number;
  sustainable_practices?: string;
  pet_friendly?: boolean;
  accessible?: boolean;
  average_rating?: number;
  is_active?: boolean;
}

export interface CreateExperiencePayload {
  title: string;
  description: string;
  category: string;
  borough_cdmx: string;
  latitude: number;
  longitude: number;
  price: number;
  duration_minutes: number;
  max_capacity: number;
  pet_friendly: boolean;
  accessible: boolean;
  sustainable_practices: string;
}

export interface AuditFile {
  id: number;
  file_name: string;
  file_type: string;
}

export interface AuditSubmission {
  id: number;
  provider_id: number;
  business_name: string;
  category: string;
  description: string;
  status?: string;
  reviewer_notes?: string;
  files_count?: number;
  files?: AuditFile[];
  created_at?: string;
}

export const catalogService = {
  async getExperiences(): Promise<Experience[]> {
    const data = await httpRequest<Experience[]>("/api/catalog/experiences/");
    return Array.isArray(data) ? data : [];
  },

  async getMyExperiences(): Promise<Experience[]> {
    const data = await httpRequest<Experience[]>("/api/catalog/experiences/mine");
    return Array.isArray(data) ? data : [];
  },

  async createExperience(payload: CreateExperiencePayload): Promise<Experience> {
    return httpRequest<Experience>("/api/catalog/experiences/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitAuditEvidence(
    businessName: string,
    category: string,
    description: string,
    files: File[]
  ): Promise<{ audit_id: number; status?: string }> {
    const formData = new FormData();
    formData.append("business_name", businessName);
    formData.append("category", category);
    formData.append("description", description);
    files.forEach((file) => formData.append("files", file));

    return httpRequest<{ audit_id: number; status?: string }>("/api/catalog/audits/submit", {
      method: "POST",
      body: formData,
    });
  },

  async getMyAudits(): Promise<AuditSubmission[]> {
    const data = await httpRequest<AuditSubmission[]>("/api/catalog/audits/my-audits");
    return Array.isArray(data) ? data : [];
  },

  async getPendingAudits(category?: string): Promise<AuditSubmission[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    const data = await httpRequest<AuditSubmission[]>(`/api/catalog/audits/pending${query}`);
    return Array.isArray(data) ? data : [];
  },

  async resolveAudit(
    auditId: number,
    decision: "APPROVED" | "REJECTED",
    notes?: string
  ): Promise<void> {
    await httpRequest(`/api/catalog/audits/${auditId}/decision`, {
      method: "PATCH",
      body: JSON.stringify({ decision, reviewer_notes: notes }),
    });
  },

  async fetchAuditFileBlob(fileId: number): Promise<Blob> {
    return fetchAuthorizedBlob(`/api/catalog/audits/files/${fileId}`);
  },
};
