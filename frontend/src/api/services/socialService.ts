import { httpRequest } from '../httpClient';

export interface ReviewItem {
    _id: string;
    experienceId: number;
    touristId: number;
    rating: number;
    comment: string;
    ecologicalComplianceVerified: boolean;
    photoKeys: string[];
    createdAt: string;
}

export interface ChatMessage {
    _id: string;
    senderId: number;
    senderRole: 'TOURIST' | 'PROVIDER';
    content: string;
    sentAt: string;
}

export const socialService = {
    // Publicar resena con evidencia fotografica contra greenwashing
    async publishReview(
        experienceId: number,
        rating: number,
        comment: string,
        photos: File[]
    ): Promise<ReviewItem> {
        const formData = new FormData();
        formData.append('experienceId', String(experienceId));
        formData.append('rating', String(rating));
        formData.append('comment', comment);
        photos.forEach((photo) => formData.append('photos', photo));

        return httpRequest<ReviewItem>('/api/social/reviews', {
            method: 'POST',
            body: formData,
        });
    },

    // Consultar calificacion promedio y resenas de una experiencia
    async getReviewsByExperience(experienceId: number): Promise<{
        average_rating: number;
        total_reviews: number;
        reviews: ReviewItem[];
    }> {
        return httpRequest(`/api/social/reviews/experience/${experienceId}`);
    },

    // Enviar mensaje directo entre turista y proveedor
    async sendMessage(experienceId: number, recipientId: number, content: string): Promise<ChatMessage> {
        return httpRequest<ChatMessage>('/api/social/chat/send', {
            method: 'POST',
            body: JSON.stringify({ experienceId, recipientId, content }),
        });
    },

    // Recuperar historial de conversacion
    async getConversation(experienceId: number, otherUserId: number): Promise<{ messages: ChatMessage[] }> {
        return httpRequest(`/api/social/chat/history/${experienceId}/${otherUserId}`);
    },
};