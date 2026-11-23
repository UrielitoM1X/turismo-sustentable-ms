// Definir clase personalizada para manejar errores estructurados de la API
export class ApiError extends Error {
    status: number;
    detail: string;

    constructor(status: number, detail: string) {
        super(detail);
        this.status = status;
        this.detail = detail;
    }
}

// Obtener token JWT almacenado localmente
export const getAuthToken = (): string | null => {
    return localStorage.getItem('ts_access_token');
};

// Guardar o eliminar sesion del usuario en almacenamiento local
export const setAuthSession = (token: string, role: string, userId: number): void => {
    localStorage.setItem('ts_access_token', token);
    localStorage.setItem('ts_user_role', role);
    localStorage.setItem('ts_user_id', String(userId));
};

export const clearAuthSession = (): void => {
    localStorage.removeItem('ts_access_token');
    localStorage.removeItem('ts_user_role');
    localStorage.removeItem('ts_user_id');
};

// Ejecutar peticion HTTP con inyeccion automatica de credenciales
export async function httpRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});

    // Asignar JSON por defecto salvo cuando se envian archivos FormData
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();
        }
        throw new ApiError(response.status, data.detail || 'Error inesperado en el servidor');
    }

    return data as T;
}