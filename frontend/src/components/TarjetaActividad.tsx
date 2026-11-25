import React from "react";

export interface ActividadItem {
  id: number;
  title: string;
  borough_cdmx: string;
  category: string;
  price: number;
  duration_minutes: number;
  max_capacity: number;
  sustainable_practices?: string;
  pet_friendly?: boolean;
  accessible?: boolean;
  average_rating?: number;
}

interface TarjetaActividadProps {
  actividad: ActividadItem;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onReservar: (actividad: ActividadItem) => void;
  onVerDetalle: (actividad: ActividadItem) => void;
  canReserve?: boolean;
}

export default function TarjetaActividad({
  actividad,
  isFavorite,
  onToggleFavorite,
  onReservar,
  onVerDetalle,
  canReserve = true,
}: TarjetaActividadProps) {
  const formattedPrecio = `$${Number(actividad.price).toLocaleString("es-MX")}`;

  return (
    <div
      onClick={() => onVerDetalle(actividad)}
      className="cursor-pointer bg-white dark:bg-[#2A312C] rounded-[1.5rem] overflow-hidden shadow-sm border border-transparent dark:border-white/5 group hover:shadow-md transition-all flex flex-col justify-between"
    >
      {/* Cabecera ilustrada con montañas */}
      <div className="relative h-52 w-full overflow-hidden bg-[#B0C49F] dark:opacity-90">
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-[55%] opacity-40 pointer-events-none"
        >
          <polygon points="0,200 150,80 300,200" fill="#1E2420" />
          <polygon points="200,200 300,120 400,200" fill="#364935" />
        </svg>

        {/* Botón de Favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(actividad.id);
          }}
          aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/40 dark:bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/60 transition-all hover:scale-110 active:scale-95"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isFavorite ? "#C81D77" : "none"}
            stroke={isFavorite ? "#C81D77" : "currentColor"}
            strokeWidth="2"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Etiqueta de Categoría */}
        <span className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
          {actividad.category}
        </span>

        {/* Insignias ecológicas inferiores */}
        <div className="absolute bottom-3 left-4 z-20 flex gap-1.5">
          {actividad.pet_friendly && (
            <span className="bg-white/85 text-[#1E201D] text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              Pet Friendly
            </span>
          )}
          {actividad.accessible && (
            <span className="bg-white/85 text-[#1E201D] text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              Accesible
            </span>
          )}
        </div>
      </div>

      {/* Detalles de la Actividad */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-xl text-[#1E201D] dark:text-white leading-tight flex-1 pr-2 line-clamp-2">
              {actividad.title}
            </h3>
            <div className="flex items-center gap-1 text-[#728C69] flex-shrink-0 bg-[#F4F1EA] dark:bg-[#18201C] px-2 py-1 rounded-md">
              {typeof actividad.average_rating === "number" && actividad.average_rating > 0 ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#D98A5F">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs font-bold text-[#1E201D] dark:text-white">
                    {actividad.average_rating.toFixed(1)}
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-semibold text-[#3B523E] dark:text-[#A5B29A]">
                  Verificado
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-[#63665E] dark:text-[#9EA399] mb-2 flex items-center gap-1.5">
            <span>
              {actividad.borough_cdmx}, CDMX · Cupo máx: {actividad.max_capacity}
            </span>
          </p>
          <p className="text-xs text-[#8C9287] line-clamp-2 mb-4">
            {actividad.sustainable_practices}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E3E5D8] dark:border-[#3D453F] mt-auto">
          <div>
            <span className="text-xs text-[#8C9287] block mb-0.5">Desde</span>
            <span className="text-base font-bold text-[#1E201D] dark:text-white">
              {formattedPrecio}{" "}
              <span className="text-xs font-normal text-muted-foreground">MXN</span>
            </span>
          </div>
          {canReserve ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReservar(actividad);
              }}
              className="bg-[#728C69] hover:bg-[#5B7153] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              Reservar
            </button>
          ) : (
            <span className="text-xs font-medium text-[#728C69] dark:text-[#A5B29A] px-3 py-1.5 rounded-xl bg-[#F4F1EA] dark:bg-[#18201C]">
              Ver detalle
            </span>
          )}
        </div>
      </div>
    </div>
  );
}