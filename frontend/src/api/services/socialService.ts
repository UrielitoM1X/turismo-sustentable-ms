import { httpRequest } from "../httpClient";

export interface ReviewItem {
  _id: string;
  experienceId: number;
  touristId: number;
  rating: number;
  comment: string;
  ecologicalComplianceVerified?: boolean;
  photoKeys?: string[];
  createdAt?: string;
}

export interface ReviewsResponse {
  average_rating: number;
  total_reviews: number;
  reviews: ReviewItem[];
}

export interface ChatMessage {
  _id?: string;
  senderId: number;
  senderRole: "TOURIST" | "PROVIDER" | string;
  content: string;
  sentAt?: string;
}

export interface ConversationSummary {
  experienceId?: number;
  experience_id?: number;
  otherUserId?: number;
  other_user_id?: number;
  touristId?: number;
  lastMessage?: string;
  last_message?: string;
  content?: string;
}

export const socialService = {
  async publishReview(params: {
    experienceId: number;
    rating: number;
    comment: string;
    ecologicalComplianceVerified: boolean;
    photos?: File[];
  }): Promise<ReviewItem> {
    const formData = new FormData();
    formData.append("experienceId", String(params.experienceId));
    formData.append("rating", String(params.rating));
    formData.append("comment", params.comment);
    formData.append(
      "ecologicalComplianceVerified",
      String(params.ecologicalComplianceVerified)
    );
    (params.photos || []).slice(0, 5).forEach((photo) => {
      formData.append("photos", photo);
    });

    return httpRequest<ReviewItem>("/api/social/reviews/", {
      method: "POST",
      body: formData,
    });
  },

  async getReviewsByExperience(experienceId: number): Promise<ReviewsResponse> {
    const data = await httpRequest<any>(`/api/social/reviews/experience/${experienceId}`);
    return {
      average_rating: data?.average_rating || 0,
      total_reviews: data?.total_reviews || 0,
      reviews: Array.isArray(data?.reviews) ? data.reviews : [],
    };
  },

  async getConversations(): Promise<ConversationSummary[]> {
    const data = await httpRequest<any>("/api/social/chat/conversations");
    return Array.isArray(data) ? data : data?.conversations || [];
  },

  async getConversationHistory(
    experienceId: number,
    otherUserId: number
  ): Promise<ChatMessage[]> {
    const data = await httpRequest<any>(
      `/api/social/chat/history/${experienceId}/${otherUserId}`
    );
    return Array.isArray(data) ? data : data?.messages || [];
  },

  async sendMessage(
    experienceId: number,
    recipientId: number,
    content: string
  ): Promise<ChatMessage> {
    return httpRequest<ChatMessage>("/api/social/chat/send", {
      method: "POST",
      body: JSON.stringify({ experienceId, recipientId, content }),
    });
  },
};
