import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BookingsProvider } from "./context/BookingsContext";
import { CatalogProvider } from "./context/CatalogContext";
import { ModalProvider } from "./context/ModalContext";
import AboutPage from "./features/about/pages/AboutPage";
import AdminAuditsPage from "./features/admin/pages/AdminAuditsPage";
import AdminBiPage from "./features/admin/pages/AdminBiPage";
import AiGuidePage from "./features/ai/pages/AiGuidePage";
import AuthPage from "./features/auth/pages/AuthPage";
import BookingsPage from "./features/bookings/pages/BookingsPage";
import CatalogPage from "./features/catalog/pages/CatalogPage";
import CollabPage from "./features/collab/pages/CollabPage";
import HomePage from "./features/home/pages/HomePage";
import ProfilePage from "./features/profile/pages/ProfilePage";
import ProviderPortalPage from "./features/provider/pages/ProviderPortalPage";
import CategoryRecommendationsPage from "./features/recommendations/pages/CategoryRecommendationsPage";
import PlaceDetailPage from "./features/recommendations/pages/PlaceDetailPage";
import RecommendationsPage from "./features/recommendations/pages/RecommendationsPage";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./router/ProtectedRoute";
import { ROUTES } from "./router/routes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CatalogProvider>
          <BookingsProvider>
            <ModalProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.HOME} element={<HomePage />} />
                  <Route path={ROUTES.EXPLORE} element={<CatalogPage />} />
                  <Route path={ROUTES.RECOMMENDATIONS} element={<RecommendationsPage />} />
                  <Route
                    path={`${ROUTES.RECOMMENDATIONS}/:categorySlug`}
                    element={<CategoryRecommendationsPage />}
                  />
                  <Route
                    path={`${ROUTES.RECOMMENDATIONS}/:categorySlug/:placeSlug`}
                    element={<PlaceDetailPage />}
                  />
                  <Route path={ROUTES.AI_GUIDE} element={<AiGuidePage />} />
                  <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                  <Route path={ROUTES.ABOUT} element={<AboutPage />} />
                  <Route path={ROUTES.COLLAB} element={<CollabPage />} />
                  <Route path={ROUTES.AUTH} element={<AuthPage />} />

                  <Route
                    path={ROUTES.BOOKINGS}
                    element={
                      <ProtectedRoute allowedRoles={["TOURIST"]}>
                        <BookingsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={ROUTES.ADMIN_AUDITS}
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminAuditsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_BI}
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminBiPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path={ROUTES.PROVIDER_DASHBOARD}
                    element={
                      <ProtectedRoute allowedRoles={["PROVIDER"]}>
                        <ProviderPortalPage initialTab="cuenta" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.PROVIDER_MONITORING}
                    element={
                      <ProtectedRoute allowedRoles={["PROVIDER"]}>
                        <ProviderPortalPage initialTab="monitoreo" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.PROVIDER_NEW}
                    element={
                      <ProtectedRoute allowedRoles={["PROVIDER"]}>
                        <ProviderPortalPage initialTab="nuevaExp" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.PROVIDER_DOCUMENTS}
                    element={
                      <ProtectedRoute allowedRoles={["PROVIDER"]}>
                        <ProviderPortalPage initialTab="nuevaExp" />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                </Route>
              </Routes>
            </ModalProvider>
          </BookingsProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
