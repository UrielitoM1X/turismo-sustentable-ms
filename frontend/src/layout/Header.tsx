import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Globe, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { AppRoute, ROUTES } from "../router/routes";
import { getInitials } from "../shared/utils/format";

export default function Header() {
  const { lang, toggleLang, t, formatRole } = useLanguage();
  const { session, normalizedRole, isAdmin, isProvider, isTourist, setAuthNotice, logout } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const goTo = (route: AppRoute) => {
    setAuthNotice("");
    setMenuOpen(false);
    setMobileMenuOpen(false);
    navigate(route);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate(ROUTES.HOME);
  };

  const navLinks: { name: string; route: AppRoute }[] = isAdmin
    ? [
        { name: t("header.nav.home"), route: ROUTES.HOME },
        { name: t("header.nav.audits"), route: ROUTES.ADMIN_AUDITS },
        { name: t("header.nav.bi"), route: ROUTES.ADMIN_BI },
        { name: t("header.nav.catalog"), route: ROUTES.EXPLORE },
        { name: t("header.nav.about"), route: ROUTES.ABOUT },
      ]
    : isProvider
    ? [
        { name: t("header.nav.home"), route: ROUTES.HOME },
        { name: t("header.nav.myBusiness"), route: ROUTES.PROVIDER_DASHBOARD },
        { name: t("header.nav.monitoring"), route: ROUTES.PROVIDER_MONITORING },
        { name: t("header.nav.evidence"), route: ROUTES.PROVIDER_DOCUMENTS },
        { name: t("header.nav.catalog"), route: ROUTES.EXPLORE },
        { name: t("header.nav.about"), route: ROUTES.ABOUT },
      ]
    : isTourist
    ? [
        { name: t("header.nav.home"), route: ROUTES.HOME },
        { name: t("header.nav.explore"), route: ROUTES.EXPLORE },
        { name: t("header.nav.recommendations"), route: ROUTES.RECOMMENDATIONS },
        { name: t("header.nav.ai"), route: ROUTES.AI_GUIDE },
        { name: t("header.nav.bookings"), route: ROUTES.BOOKINGS },
        { name: t("header.nav.about"), route: ROUTES.ABOUT },
      ]
    : [
        { name: t("header.nav.home"), route: ROUTES.HOME },
        { name: t("header.nav.explore"), route: ROUTES.EXPLORE },
        { name: t("header.nav.recommendations"), route: ROUTES.RECOMMENDATIONS },
        { name: t("header.nav.ai"), route: ROUTES.AI_GUIDE },
        { name: t("header.nav.about"), route: ROUTES.ABOUT },
        { name: t("header.nav.collab"), route: ROUTES.COLLAB },
      ];

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ease-in-out ${
        isScrolled
          ? "bg-background/95 backdrop-blur-lg shadow-md"
          : "bg-background/80 backdrop-blur-sm shadow-none"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <button
          onClick={() => goTo(ROUTES.HOME)}
          className="text-sm font-bold tracking-widest text-foreground flex items-center gap-2 ml-2"
        >
          <div className="bg-green-700/10 p-1.5 rounded-full flex items-center justify-center">
            <img src="/hoja.svg" alt={t("header.brand")} className="w-4 h-4" />
          </div>
          <span>{t("header.brand")}</span>
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.route === ROUTES.HOME
                ? location.pathname === ROUTES.HOME
                : location.pathname === link.route ||
                  location.pathname.startsWith(`${link.route}/`);
            return (
              <button
                key={link.route}
                onClick={() => goTo(link.route)}
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
                      {formatRole(normalizedRole)}
                    </span>
                  </div>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => goTo(ROUTES.ADMIN_AUDITS)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium text-[#C81D77] hover:bg-muted"
                      >
                        {t("header.menu.auditEvidence")}
                      </button>
                      <button
                        onClick={() => goTo(ROUTES.ADMIN_BI)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.biPanel")}
                      </button>
                    </>
                  )}

                  {isProvider && (
                    <>
                      <button
                        onClick={() => goTo(ROUTES.PROVIDER_DASHBOARD)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium text-[#728C69] hover:bg-muted"
                      >
                        {t("header.menu.myBusinessExp")}
                      </button>
                      <button
                        onClick={() => goTo(ROUTES.PROVIDER_MONITORING)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.myMonitoring")}
                      </button>
                      <button
                        onClick={() => goTo(ROUTES.PROVIDER_DOCUMENTS)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.uploadEvidence")}
                      </button>
                    </>
                  )}

                  {isTourist && (
                    <>
                      <button
                        onClick={() => goTo(ROUTES.BOOKINGS)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.myBookings")}
                      </button>
                      <button
                        onClick={() => goTo(ROUTES.PROFILE)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.menu.myProfile")}
                      </button>
                      <button
                        onClick={() => goTo(ROUTES.COLLAB)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs font-medium hover:bg-muted"
                      >
                        {t("header.nav.collab")}
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-2 mt-1 border-t border-gray-100 dark:border-white/10 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> {t("header.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => goTo(ROUTES.AUTH)}
              className="rounded-full px-5 h-10 flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:border-[#728C69] bg-card transition-all"
            >
              <img src="/usuario.svg" alt={t("header.signIn")} className="w-4 h-4" />
              <span className="text-xs font-medium">{t("header.signIn")}</span>
            </button>
          )}

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

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 dark:border-white/10 bg-background/95 backdrop-blur-lg px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.route;
            return (
              <button
                key={link.route}
                onClick={() => goTo(link.route)}
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
