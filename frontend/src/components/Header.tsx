import React, { useEffect, useRef, useState } from "react";
import { Moon, Sun, Globe, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export type RouteView =
  | "home"
  | "busqueda"
  | "ia"
  | "reservas"
  | "perfil"
  | "admin-auditorias"
  | "admin-bi"
  | "negocio-dashboard"
  | "negocio-monitoreo"
  | "negocio-nueva"
  | "negocio-documentos"
  | "about"
  | "auth";

interface HeaderProps {
  currentView: RouteView;
  onNavigate: (view: RouteView) => void;
  session: { token: string | null; role: string | null; name: string | null };
  onLogout: () => void;
}

export default function Header({
  currentView,
  onNavigate,
  session,
  onLogout,
}: HeaderProps) {
  const { lang, toggleLang, t, formatRole } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen && !mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, mobileMenuOpen]);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const role = session.role?.toUpperCase().trim() || "";
  const isAdmin = role === "ADMIN" || role === "ADMINISTRADOR";
  const isProvider = role === "PROVIDER" || role === "PROVEEDOR";
  const isTourist = role === "TOURIST" || role === "TURISTA";

  const navLinks: { name: string; view: RouteView }[] = isAdmin
    ? [
        { name: t("header.nav.home"), view: "home" },
        { name: t("header.nav.audits"), view: "admin-auditorias" },
        { name: t("header.nav.bi"), view: "admin-bi" },
        { name: t("header.nav.catalog"), view: "busqueda" },
        { name: t("header.nav.about"), view: "about" },
      ]
    : isProvider
    ? [
        { name: t("header.nav.home"), view: "home" },
        { name: t("header.nav.myBusiness"), view: "negocio-dashboard" },
        { name: t("header.nav.monitoring"), view: "negocio-monitoreo" },
        { name: t("header.nav.evidence"), view: "negocio-documentos" },
        { name: t("header.nav.catalog"), view: "busqueda" },
        { name: t("header.nav.about"), view: "about" },
      ]
    : isTourist
    ? [
        { name: t("header.nav.home"), view: "home" },
        { name: t("header.nav.explore"), view: "busqueda" },
        { name: t("header.nav.ai"), view: "ia" },
        { name: t("header.nav.bookings"), view: "reservas" },
        { name: t("header.nav.about"), view: "about" },
      ]
    : [
        { name: t("header.nav.home"), view: "home" },
        { name: t("header.nav.explore"), view: "busqueda" },
        { name: t("header.nav.ai"), view: "ia" },
        { name: t("header.nav.about"), view: "about" },
      ];

  const getInitials = (name?: string | null) => {
    if (!name) return "TS";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-md"
          : "bg-background/80 backdrop-blur-sm shadow-none"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="text-sm font-bold tracking-widest text-foreground flex items-center gap-2 ml-2"
        >
          <div className="bg-green-700/10 p-1.5 rounded-full flex items-center justify-center">
            <img src="/hoja.svg" alt={t("header.brand")} className="w-4 h-4" />
          </div>
          <span>{t("header.brand")}</span>
        </button>

        {/* Central navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive = currentView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`relative text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 block w-1.5 h-1.5 bg-[#728C69] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User actions & theme/language toggles */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={toggleLang}
            title={t("header.langTooltip")}
            className="h-9 px-2.5 rounded-full border border-gray-200 dark:border-white/10 hover:border-[#728C69] text-xs font-semibold flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang.toUpperCase()}
          </button>

          <button
            onClick={toggleDark}
            title={t("header.themeTooltip")}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 hover:border-[#728C69] flex items-center justify-center"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {session.token ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                className="rounded-full pl-2 pr-3 h-10 flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:border-[#728C69] bg-card transition-all"
              >
                <span className="w-7 h-7 rounded-full bg-[#728C69] text-white text-xs font-bold flex items-center justify-center">
                  {getInitials(session.name)}
                </span>
                <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline-block">
                  {session.name?.split("@")[0] || t("header.myAccount")}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl shadow-lg bg-white dark:bg-[#2A312C] border border-gray-200 dark:border-white/10 z-50">
                  <div className="px-2 py-1.5 border-b border-gray-100 dark:border-white/10 mb-1">
                    <p className="text-sm font-semibold truncate">{session.name}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#728C69]/15 text-[#728C69] dark:text-[#A5B29A] uppercase tracking-wider">
                      {formatRole(role)}
                    </span>
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("admin-auditorias"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium text-[#C81D77] hover:bg-muted"
                      >
                        {t("header.menu.auditEvidence")}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("admin-bi"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.biPanel")}
                      </button>
                    </>
                  )}

                  {isProvider && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("negocio-dashboard"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium text-[#728C69] hover:bg-muted"
                      >
                        {t("header.menu.myBusinessExp")}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("negocio-monitoreo"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.myMonitoring")}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("negocio-documentos"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.uploadEvidence")}
                      </button>
                    </>
                  )}

                  {isTourist && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("reservas"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.myBookings")}
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("perfil"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.myProfile")}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2 py-2 mt-1 border-t border-gray-100 dark:border-white/10 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t("header.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate("auth")}
              className="rounded-full px-5 h-10 flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:border-[#728C69] bg-card transition-all"
            >
              <img src="/usuario.svg" alt={t("header.signIn")} className="w-4 h-4" />
              <span className="text-xs font-medium">{t("header.signIn")}</span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={t("header.mobileMenuAria")}
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 hover:border-[#728C69] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 dark:border-white/10 bg-background/95 backdrop-blur-lg px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = currentView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate(link.view);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#728C69]/15 text-[#728C69] dark:text-[#A5B29A]"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
