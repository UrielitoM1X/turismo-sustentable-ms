import { httpRequest } from "../httpClient";
import { Experience } from "./catalogService";

export interface AiChatResponse {
  assistant_reply?: string;
  suggested_experiences?: Experience[];
}

export const aiService = {
  async askAssistant(message: string): Promise<AiChatResponse> {
    return httpRequest<AiChatResponse>("/api/ai/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};
