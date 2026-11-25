export const ROUTES = {
  HOME: "/",
  EXPLORE: "/explorar",
  RECOMMENDATIONS: "/recomendaciones",
  AI_GUIDE: "/guia-ia",
  BOOKINGS: "/reservas",
  PROFILE: "/perfil",
  ABOUT: "/acerca",
  COLLAB: "/colabora",
  AUTH: "/auth",
  ADMIN_AUDITS: "/admin/auditorias",
  ADMIN_BI: "/admin/bi",
  PROVIDER_DASHBOARD: "/negocio",
  PROVIDER_MONITORING: "/negocio/monitoreo",
  PROVIDER_NEW: "/negocio/nueva",
  PROVIDER_DOCUMENTS: "/negocio/documentos",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
