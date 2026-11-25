import { httpRequest, saveUserSession } from "../httpClient";

export type UserRole = "TOURIST" | "PROVIDER" | "ADMIN";

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  role: UserRole;
  user_id?: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: "TOURIST" | "PROVIDER";
  preferred_language?: "es" | "en";
  business_name?: string;
  rfc?: string;
}

export interface UserProfile {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
  travel_interests?: string[];
  accessibility_needs?: string[];
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await httpRequest<AuthResponse>("/api/auth/users/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveUserSession(
      res.access_token,
      res.role,
      payload.full_name || payload.email,
      res.user_id
    );
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await httpRequest<AuthResponse>("/api/auth/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveUserSession(res.access_token, res.role, email, res.user_id);
    return res;
  },

  async getMe(): Promise<UserProfile> {
    return httpRequest<UserProfile>("/api/auth/users/me");
  },

  async updatePreferences(
    travelInterests: string[],
    accessibilityNeeds: string[]
  ): Promise<void> {
    await httpRequest("/api/auth/users/preferences", {
      method: "PUT",
      body: JSON.stringify({
        travel_interests: travelInterests,
        accessibility_needs: accessibilityNeeds,
      }),
    });
  },
};
