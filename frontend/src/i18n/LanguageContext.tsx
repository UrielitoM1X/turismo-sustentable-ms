import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Lang, translations } from "./translations";

const LANG_STORAGE_KEY = "ts_lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCategory: (category: string) => string;
  formatStatus: (status: string) => string;
  formatRole: (role: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // Ignore storage access errors
  }
  return "es";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "es" ? "en" : "es";
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "es" ? "Turismo Sustentable CDMX" : "Sustainable Tourism CDMX";
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[lang] || translations.es;
      let text = dict[key] ?? translations.es[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return text;
    },
    [lang]
  );

  const formatCategory = useCallback(
    (category: string): string => {
      const normalized = category.trim();
      const mapKey = `cat.${normalized}`;
      const dict = translations[lang] || translations.es;
      return dict[mapKey] ?? normalized;
    },
    [lang]
  );

  const formatStatus = useCallback(
    (status: string): string => {
      const upper = String(status || "").toUpperCase().trim();
      const mapKey = `status.${upper}`;
      const dict = translations[lang] || translations.es;
      return dict[mapKey] ?? upper;
    },
    [lang]
  );

  const formatRole = useCallback(
    (role: string | null | undefined): string => {
      const upper = String(role || "").toUpperCase().trim();
      if (upper === "ADMINISTRADOR") return translations[lang]["role.ADMIN"];
      if (upper === "PROVEEDOR") return translations[lang]["role.PROVIDER"];
      if (upper === "TURISTA") return translations[lang]["role.TOURIST"];
      return translations[lang][`role.${upper}`] ?? upper;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, toggleLang, t, formatCategory, formatStatus, formatRole }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
