import { httpRequest } from '../httpClient';
import { Experience } from './catalogService';

export interface RecommendedItem {
    experience: Experience;
    affinity_score: number;
    explanation: string;
}

export const aiService = {
    // Obtener recomendaciones personalizadas con justificacion breve
    async getRecommendations(prefs: {
        travel_interests: string[];
        preferred_borough?: string;
        requires_accessibility?: boolean;
        with_pets?: boolean;
        max_budget?: number;
    }): Promise<{ total_recommended: number; recommendations: RecommendedItem[] }> {
        return httpRequest('/api/ai/assistant/recommendations', {
            method: 'POST',
            body: JSON.stringify(prefs),
        });
    },

    // Consultar burbuja de asistente conversacional IA
    async askAssistant(
        message: string,
        travelInterests: string[] = []
    ): Promise<{ assistant_reply: string; suggested_experiences: RecommendedItem[] }> {
        return httpRequest('/api/ai/assistant/chat', {
            method: 'POST',
            body: JSON.stringify({ message, travel_interests: travelInterests }),
        });
    },
};