import React from "react";
import AboutHeroSection from "../components/AboutHeroSection";
import TeamSection from "../components/TeamSection";

export default function AboutPage() {
  return (
    <main className="relative flex-1 w-full overflow-hidden bg-[#F2EFE9] dark:bg-[#18201C] text-[#232621] dark:text-[#E2E4DE] transition-colors duration-300">
      <AboutHeroSection />
      <TeamSection />
    </main>
  );
}
