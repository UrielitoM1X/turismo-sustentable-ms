import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Experience } from "../api/services/catalogService";
import { useLanguage } from "../i18n/LanguageContext";
import { ROUTES } from "../router/routes";
import { useAuth } from "./AuthContext";

interface ModalContextValue {
  detailExperience: Experience | null;
  checkoutExperience: Experience | null;
  openDetail: (experience: Experience) => void;
  closeDetail: () => void;
  openCheckout: (experience: Experience) => void;
  closeCheckout: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const { session, isTourist, setAuthNotice } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [detailExperience, setDetailExperience] = useState<Experience | null>(null);
  const [checkoutExperience, setCheckoutExperience] = useState<Experience | null>(null);

  useEffect(() => {
    if (!session.token) {
      setCheckoutExperience(null);
    }
  }, [session.token]);

  const openDetail = useCallback((experience: Experience) => {
    setDetailExperience(experience);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailExperience(null);
  }, []);

  const openCheckout = useCallback(
    (experience: Experience) => {
      if (!session.token) {
        setAuthNotice(t("checkout.loginRequired"));
        navigate(ROUTES.AUTH);
        return;
      }
      if (!isTourist) return;
      setCheckoutExperience(experience);
    },
    [session.token, isTourist, setAuthNotice, t, navigate]
  );

  const closeCheckout = useCallback(() => {
    setCheckoutExperience(null);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({
      detailExperience,
      checkoutExperience,
      openDetail,
      closeDetail,
      openCheckout,
      closeCheckout,
    }),
    [
      detailExperience,
      checkoutExperience,
      openDetail,
      closeDetail,
      openCheckout,
      closeCheckout,
    ]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModals(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModals must be used inside ModalProvider");
  }
  return ctx;
}
