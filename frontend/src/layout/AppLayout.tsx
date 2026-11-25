import React from "react";
import { Outlet } from "react-router-dom";
import CheckoutModal from "../features/bookings/components/CheckoutModal";
import ExperienceDetailModal from "../features/social/components/ExperienceDetailModal";
import Header from "./Header";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <Outlet />
      <ExperienceDetailModal />
      <CheckoutModal />
    </div>
  );
}
