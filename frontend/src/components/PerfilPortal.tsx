import React, { useEffect, useState } from "react";
import TarjetaActividad, { ActividadItem } from "./TarjetaActividad";
import { apiFetch } from "../api/client";
import { RouteView } from "./Header";

interface PerfilPortalProps {
  session: { token: string | null; role: string | null; name: string | null };
  experiences: ActividadItem[];
  favoriteIds: number[];
  onToggleFavorite: (id: number) => void;
  onReservar: (actividad: ActividadItem) => void;
  onVerDetalle: (actividad: ActividadItem) => void;
  onNavigate: (view: RouteView) => void;
  onLogout: () => void;
}

export default function PerfilPortal({
  session,
  experiences,
  favoriteIds,
  onToggleFavorite,
  onReservar,
  onVerDetalle,
  onNavigate,
  onLogout,
}: PerfilPortalProps) {
  const [subView, setSubView] = useState<"perfil" | "favoritos">("perfil");
  const [reservasCount, setReservasCount] = useState(0);
  const [intereses, setIntereses] = useState<string[]>([
    "Naturaleza",
    "Cultura",
    "Ecoturismo",
    "Pet Friendly",
  ]);
  const [nuevoInteres, setNuevoInteres] = useState("");
  const [editandoIntereses, setEditandoIntereses] = useState(false);

  useEffect(() => {
    if (!session.token) return;
    apiFetch<any[]>("/api/bookings/reservations/my-bookings")
      .then((list) => setReservasCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setReservasCount(0));
  }, [session.token]);

  const getInitials = (name?: string | null) => {
    if (!name) return "TS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const favoritasList = experiences.filter((exp) => favoriteIds.includes(exp.id));

  if (!session.token) {
    return (
      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] py-12 px-4 flex justify-center">
        <div className="w-full max-w-md bg-white dark:bg-[#2A312C] rounded-[2rem] p-8 text-center shadow-sm h-fit">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-[#728C69]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl mb-2">Inicia sesión</h2>
          <p className="text-sm text-[#63665E] dark:text-[#A5B29A] mb-6">
            Inicia sesión con tu cuenta de Turista para consultar tus favoritos e impacto ambiental.
          </p>
          <button
            onClick={() => onNavigate("auth")}
            className="bg-[#728C69] hover:bg-[#5B7153] text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  // SUBVISTA: MIS FAVORITOS
  if (subView === "favoritos") {
    return (
      <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-8 px-4 flex justify-center pb-24">
        <div className="w-full max-w-5xl flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setSubView("perfil")}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#2A312C] flex items-center justify-center shadow-sm text-[#728C69] dark:text-[#A5B29A] hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div>
              <h1 className="font-serif text-3xl text-[#1E201D] dark:text-white">Mis Favoritos</h1>
              <p className="text-sm text-[#63665E] dark:text-[#A5B29A]">
                {favoritasList.length} experiencia{favoritasList.length === 1 ? "" : "s"} guardada
                {favoritasList.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {favoritasList.length === 0 ? (
            <div className="bg-white dark:bg-[#2A312C] border border-dashed border-[#8C9287]/40 rounded-3xl p-12 text-center my-6">
              <h3 className="text-lg font-serif mb-2">Aún no has guardado favoritos</h3>
              <p className="text-sm text-[#63665E] dark:text-[#A5B29A] max-w-sm mx-auto mb-6">
                Explora el catálogo y presiona el corazón en cualquier experiencia para armar tu ruta ecológica.
              </p>
              <button
                onClick={() => onNavigate("busqueda")}
                className="text-xs bg-[#728C69] text-white px-5 py-2.5 rounded-full hover:bg-[#5B7153] transition-colors"
              >
                Ir a explorar experiencias
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoritasList.map((exp) => (
                <TarjetaActividad
                  key={exp.id}
                  actividad={exp}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onReservar={onReservar}
                  onVerDetalle={onVerDetalle}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // VISTA PRINCIPAL: MI PERFIL
  return (
    <main className="min-h-[calc(100vh-4rem)] w-full bg-[#F4F1EA] dark:bg-[#1E2420] transition-colors duration-300 py-8 px-4 flex justify-center pb-24">
      <div className="w-full max-w-md flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-[#1E201D] dark:text-white">Mi perfil</h1>
          <button
            onClick={() => setEditandoIntereses(!editandoIntereses)}
            className="text-[#C81D77] dark:text-[#E24A96] text-sm font-medium hover:underline"
          >
            {editandoIntereses ? "Listo" : "Preferencias"}
          </button>
        </div>

        {/* Info de Usuario */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-[#728C69] flex items-center justify-center text-white font-serif text-2xl flex-shrink-0 shadow-sm">
            {getInitials(session.name)}
          </div>
          <div>
            <h2 className="text-xl font-medium text-[#1E201D] dark:text-white">
              {session.name || "Turista Sustentable"}
            </h2>
            <p className="text-xs text-[#728C69] dark:text-[#A5B29A] font-medium mt-1 uppercase tracking-wider">
              {session.role || "Viajero consciente"} · CDMX
            </p>
          </div>
        </div>

        {/* Impacto Positivo */}
        <div className="bg-white dark:bg-[#2A312C] rounded-[1.5rem] p-5 mb-8 shadow-sm border border-transparent dark:border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-[#1E201D] dark:text-white mb-1">
              Tu impacto positivo
            </h3>
            <p className="text-xs text-[#63665E] dark:text-[#A5B29A]">
              {reservasCount} experiencia{reservasCount === 1 ? "" : "s"} reservada
              {reservasCount === 1 ? "" : "s"} · ${reservasCount * 50} MXN al fondo ambiental
            </p>
          </div>
          <div className="text-center flex flex-col items-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#728C69"
              strokeWidth="1.5"
              className="mb-1"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3C18 19 15 20 11 20z" />
              <path d="M11 20c-5 0-9-4-9-9 0-4.5 3-7.5 5-9 1 1 2 2 3 4" />
            </svg>
            <span className="text-[10px] text-[#8C9287]">Turismo ético</span>
          </div>
        </div>

        {/* Tu actividad (Reservas / Favoritos) */}
        <h3 className="font-serif text-xl text-[#1E201D] dark:text-white mb-4">Tu actividad</h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => onNavigate("reservas")}
            className="bg-white dark:bg-[#2A312C] rounded-2xl p-4 text-center shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
          >
            <span className="block text-2xl font-serif text-[#728C69] dark:text-[#A5B29A] mb-1">
              {reservasCount}
            </span>
            <span className="text-[10px] text-[#8C9287] dark:text-[#9EA399] uppercase tracking-wider">
              Reservas
            </span>
          </button>

          <button
            onClick={() => setSubView("favoritos")}
            className="bg-white dark:bg-[#2A312C] rounded-2xl p-4 text-center shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
          >
            <span className="block text-2xl font-serif text-[#728C69] dark:text-[#A5B29A] mb-1">
              {favoritasList.length}
            </span>
            <span className="text-[10px] text-[#8C9287] dark:text-[#9EA399] uppercase tracking-wider">
              Favoritos
            </span>
          </button>
        </div>

        {/* Mis intereses */}
        <h3 className="font-serif text-xl text-[#1E201D] dark:text-white mb-4">Mis intereses</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {intereses.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (editandoIntereses) {
                  setIntereses(intereses.filter((_, i) => i !== idx));
                }
              }}
              className="bg-[#E3E5D8] dark:bg-[#3D453F] text-[#4A4D46] dark:text-[#D1D5CD] text-xs font-medium px-4 py-2 rounded-full"
            >
              {item} {editandoIntereses && "×"}
            </button>
          ))}
        </div>

        {editandoIntereses && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nuevoInteres.trim()) {
                setIntereses([...intereses, nuevoInteres.trim()]);
                setNuevoInteres("");
              }
            }}
            className="flex gap-2 mb-8"
          >
            <input
              value={nuevoInteres}
              onChange={(e) => setNuevoInteres(e.target.value)}
              placeholder="Añadir interés (ej. Senderismo)"
              className="flex-1 bg-white dark:bg-[#2A312C] rounded-xl px-3 h-10 text-xs"
            />
            <button
              type="submit"
              className="bg-[#728C69] text-white text-xs px-4 rounded-xl font-medium"
            >
              Agregar
            </button>
          </form>
        )}

        {/* Experiencias y Exploración */}
        <h3 className="font-serif text-xl text-[#1E201D] dark:text-white mb-4 mt-4">
          Experiencias y Exploración
        </h3>
        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={() => setSubView("favoritos")}
            className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#728C69" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span className="text-sm font-medium">
                Mis Favoritos ({favoritasList.length})
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C9287" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={() => onNavigate("ia")}
            className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#728C69]/15 flex items-center justify-center text-[#728C69]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold block">Recomendaciones con IA</span>
                <span className="text-[11px] text-[#8C9287]">
                  Itinerarios personalizados en CDMX
                </span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C9287" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={() => onNavigate("reservas")}
            className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#728C69]/15 flex items-center justify-center text-[#728C69]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold block">Mis Reservas</span>
                <span className="text-[11px] text-[#8C9287]">
                  {reservasCount} actividades registradas
                </span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C9287" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={onLogout}
            className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C81D77" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span className="text-sm font-medium text-[#C81D77] dark:text-[#E24A96]">
                Cerrar sesión
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C9287" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}