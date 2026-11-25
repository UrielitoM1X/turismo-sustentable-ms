import React, { useEffect, useRef, useState } from "react";
import { Moon, Sun, Globe, LogOut, ChevronDown, Menu, X } from "lucide-react";

export type RouteView =
  | "home"
  | "busqueda"
  | "ia"
  | "reservas"
  | "perfil"
  | "admin-auditorias"
  | "admin-bi"
  | "negocio-dashboard"
  | "negocio-nueva"
  | "negocio-documentos"
  | "about"
  | "auth";

interface HeaderProps {
  currentView: RouteView;
  onNavigate: (view: RouteView) => void;
  session: { token: string | null; role: string | null; name: string | null };
  onLogout: () => void;
  lang: "es" | "en";
  onToggleLang: () => void;
}

export default function Header({
  currentView,
  onNavigate,
  session,
  onLogout,
  lang,
  onToggleLang,
}: HeaderProps) {
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
        { name: lang === "es" ? "Inicio" : "Home", view: "home" },
        { name: lang === "es" ? "Auditorías" : "Audits", view: "admin-auditorias" },
        { name: lang === "es" ? "Panel BI" : "BI Panel", view: "admin-bi" },
        { name: lang === "es" ? "Catálogo" : "Catalog", view: "busqueda" },
        { name: lang === "es" ? "Nosotros" : "About", view: "about" },
      ]
    : isProvider
    ? [
        { name: lang === "es" ? "Inicio" : "Home", view: "home" },
        { name: lang === "es" ? "Mi Negocio" : "My Business", view: "negocio-dashboard" },
        { name: lang === "es" ? "Evidencias" : "Evidence", view: "negocio-documentos" },
        { name: lang === "es" ? "Catálogo" : "Catalog", view: "busqueda" },
        { name: lang === "es" ? "Nosotros" : "About", view: "about" },
      ]
    : isTourist
    ? [
        { name: lang === "es" ? "Inicio" : "Home", view: "home" },
        { name: lang === "es" ? "Explorar" : "Explore", view: "busqueda" },
        { name: lang === "es" ? "Guía IA" : "AI Guide", view: "ia" },
        { name: lang === "es" ? "Mis Reservas" : "My Bookings", view: "reservas" },
        { name: lang === "es" ? "Nosotros" : "About", view: "about" },
      ]
    : [
        { name: lang === "es" ? "Inicio" : "Home", view: "home" },
        { name: lang === "es" ? "Explorar" : "Explore", view: "busqueda" },
        { name: lang === "es" ? "Guía IA" : "AI Guide", view: "ia" },
        { name: lang === "es" ? "Nosotros" : "About", view: "about" },
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
            <img src="/hoja.svg" alt="Hoja" className="w-4 h-4" />
          </div>
          <span>TURISMO SUSTENTABLE</span>
        </button>

        {/* Navegación central */}
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

        {/* Acciones de usuario y tema */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={onToggleLang}
            title="Cambiar idioma"
            className="h-9 px-2.5 rounded-full border border-gray-200 dark:border-white/10 hover:border-[#728C69] text-xs font-semibold flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang.toUpperCase()}
          </button>

          <button
            onClick={toggleDark}
            title="Tema claro / oscuro"
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
                  {session.name?.split("@")[0] || "Mi cuenta"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl shadow-lg bg-white dark:bg-[#2A312C] border border-gray-200 dark:border-white/10 z-50">
                  <div className="px-2 py-1.5 border-b border-gray-100 dark:border-white/10 mb-1">
                    <p className="text-sm font-semibold truncate">{session.name}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#728C69]/15 text-[#728C69] dark:text-[#A5B29A] uppercase tracking-wider">
                      {role}
                    </span>
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("admin-auditorias"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium text-[#C81D77] hover:bg-muted"
                      >
                        Auditoría de Evidencias
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("admin-bi"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        Panel BI y Analítica
                      </button>
                    </>
                  )}

                  {isProvider && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("negocio-dashboard"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium text-[#728C69] hover:bg-muted"
                      >
                        Mi Negocio y Experiencias
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("negocio-documentos"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        Subir Evidencias
                      </button>
                    </>
                  )}

                  {isTourist && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("reservas"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        Mis Reservaciones
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onNavigate("perfil"); }}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        Mi Perfil y Favoritos
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
                    <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate("auth")}
              className="rounded-full px-5 h-10 flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:border-[#728C69] bg-card transition-all"
            >
              <img src="/usuario.svg" alt="Usuario" className="w-4 h-4" />
              <span className="text-xs font-medium">
                {lang === "es" ? "Iniciar sesión" : "Sign in"}
              </span>
            </button>
          )}

          {/* Botón menú móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
            className="md:hidden w-9 h-9 rounded-full border border-gray-200 dark:border-white/10 hover:border-[#728C69] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menú de navegación móvil */}
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