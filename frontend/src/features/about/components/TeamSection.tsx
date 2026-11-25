import React from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { TEAM_MEMBERS } from "../data/team";

export default function TeamSection() {
  const { t } = useLanguage();

  return (
    <section className="relative isolate flex w-full flex-col items-center justify-center px-6 py-24 md:px-16 lg:px-24 text-center">
      <div
        className="pointer-events-none absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] lg:-bottom-[200px] lg:-left-[200px] lg:w-[700px] lg:h-[700px] rounded-full bg-[#E3E5D8] dark:bg-[#202823] -z-10 transition-colors duration-300 opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-[50px] -right-[50px] w-[300px] h-[300px] lg:-top-[100px] lg:-right-[100px] lg:w-[500px] lg:h-[500px] rounded-full bg-[#F5DCE8] dark:bg-[#382430] -z-10 transition-colors duration-300 opacity-40"
        aria-hidden="true"
      />

      <div className="z-10 flex flex-col items-center space-y-4">
        <p className="text-[#C81D77] text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase">
          {t("about.team.badge")}
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-[56px] text-[#1E201D] dark:text-white leading-tight">
          {t("about.team.title")}
        </h2>
      </div>

      <div className="z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-12 lg:gap-x-6 mt-16 max-w-7xl mx-auto w-full">
        {TEAM_MEMBERS.map((member) => (
          <div key={member.name} className="flex flex-col items-center">
            <div className="relative flex items-center justify-center w-[110px] h-[110px] lg:w-[130px] lg:h-[130px]">
              <div className="absolute inset-0 rounded-full border-[2px] border-dashed border-[#A5B29A]/60 dark:border-[#38463D]/80" />
              <div
                className={`w-[85px] h-[85px] lg:w-[100px] lg:h-[100px] rounded-full flex items-center justify-center font-serif text-3xl lg:text-[34px] transition-colors duration-300 ${
                  member.color === "green"
                    ? "bg-[#B0BCA7] dark:bg-[#344439] text-[#2A352F] dark:text-[#E2E4DE]"
                    : "bg-[#EBE9E0] dark:bg-[#2A352F] text-[#3B523E] dark:text-[#E2E4DE]"
                }`}
              >
                {member.initials}
              </div>
            </div>

            <div className="mt-5 text-center flex flex-col items-center justify-center max-w-[140px]">
              <h3 className="text-sm font-medium text-[#1E201D] dark:text-white leading-snug">
                {member.name}
              </h3>
              <p className="text-[11px] text-[#63665E] dark:text-[#9EA399] mt-1.5">
                {t(member.roleKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="z-10 mt-20 inline-flex items-center gap-3 rounded-full bg-white dark:bg-[#1E2722] px-6 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-black/5 dark:border-white/10 transition-colors duration-300">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C81D77"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
        <span className="text-xs sm:text-sm font-medium text-[#2A2D27] dark:text-[#D1D5CD]">
          {t("about.team.groupBadge")}
        </span>
      </div>
    </section>
  );
}
