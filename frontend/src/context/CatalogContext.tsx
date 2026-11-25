import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { catalogService, Experience } from "../api/services/catalogService";
import { bookingService } from "../api/services/bookingService";
import { useAuth } from "./AuthContext";

interface CatalogContextValue {
  experiences: Experience[];
  favoriteIds: number[];
  reloadCatalog: () => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  isFavorite: (id: number) => boolean;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function readStoredFavorites(key: string): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.map(Number) : [];
  } catch {
    return [];
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { session, isTourist, currentUserId } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const favKey = `ts_favs_${currentUserId ?? session.name ?? "guest"}`;
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    readStoredFavorites(favKey)
  );

  const reloadCatalog = useCallback(async () => {
    try {
      const list = await catalogService.getExperiences();
      setExperiences(list);
    } catch {
      setExperiences([]);
    }
  }, []);

  useEffect(() => {
    reloadCatalog();
  }, [reloadCatalog]);

  useEffect(() => {
    if (session.token && isTourist) {
      bookingService
        .getFavorites()
        .then((ids) => {
          setFavoriteIds(ids);
          localStorage.setItem(favKey, JSON.stringify(ids));
        })
        .catch(() => {
          setFavoriteIds(readStoredFavorites(favKey));
        });
    } else {
      setFavoriteIds(readStoredFavorites(favKey));
    }
  }, [favKey, session.token, isTourist]);

  const toggleFavorite = useCallback(
    async (id: number) => {
      setFavoriteIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem(favKey, JSON.stringify(next));
        return next;
      });

      if (session.token && isTourist) {
        try {
          const ids = await bookingService.toggleFavorite(id);
          if (ids) {
            setFavoriteIds(ids);
            localStorage.setItem(favKey, JSON.stringify(ids));
          }
        } catch {
          // Local fallback already applied optimistically
        }
      }
    },
    [favKey, session.token, isTourist]
  );

  const isFavorite = useCallback(
    (id: number) => favoriteIds.includes(id),
    [favoriteIds]
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      experiences,
      favoriteIds,
      reloadCatalog,
      toggleFavorite,
      isFavorite,
    }),
    [experiences, favoriteIds, reloadCatalog, toggleFavorite, isFavorite]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used inside CatalogProvider");
  }
  return ctx;
}
