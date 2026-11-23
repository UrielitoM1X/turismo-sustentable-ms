import { httpRequest, setAuthSession } from '../httpClient';

export type UserRole = 'TOURIST' | 'PROVIDER' | 'ADMIN';

export interface AuthResponse {
    access_token: string;
    token_type: string;
    role: UserRole;
    user_id: number;
}

export interface RegisterPayload {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    preferred_language?: 'es' | 'en';
    business_name?: string;
    rfc?: string;
}

export const authService = {
    // Registrar usuario y almacenar sesion automaticamente
    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const res = await httpRequest<AuthResponse>('/api/auth/users/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        setAuthSession(res.access_token, res.role, res.user_id);
        return res;
    },

    // Iniciar sesion con correo y contrasena
    async login(email: string, password: string): Promise<AuthResponse> {
        const res = await httpRequest<AuthResponse>('/api/auth/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        setAuthSession(res.access_token, res.role, res.user_id);
        return res;
    },

    // Guardar intereses y necesidades de accesibilidad del turista
    async updatePreferences(travelInterests: string[], accessibilityNeeds: string[]): Promise<void> {
        await httpRequest('/api/auth/users/preferences', {
            method: 'PUT',
            body: JSON.stringify({
                travel_interests: travelInterests,
                accessibility_needs: accessibilityNeeds,
            }),
        });
    },
};