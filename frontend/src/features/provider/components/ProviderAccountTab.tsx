import React from "react";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";

export type ProviderTab = "cuenta" | "monitoreo" | "solicitudes" | "nuevaExp" | "mensajes";

interface ProviderAccountTabProps {
  businessName: string;
  category: string;
  borough: string;
  onSelectTab: (tab: ProviderTab) => void;
}

export default function ProviderAccountTab({
  businessName,
  category,
  borough,
  onSelectTab,
}: ProviderAccountTabProps) {
  const { t, formatCategory } = useLanguage();

  return (
    <div className="max-w-md mx-auto flex flex-col">
      <h1 className="font-serif text-3xl text-[#1E201D] dark:text-white mb-6">
        {t("provider.accountTitle")}
      </h1>

      <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-5 mb-6 shadow-sm border border-transparent dark:border-white/5">
        <div className="w-full h-32 bg-[#B4CBB0] rounded-xl mb-4 relative overflow-hidden">
          <svg
            viewBox="0 0 400 120"
            className="w-full h-full object-cover"
            preserveAspectRatio="none"
          >
            <circle cx="320" cy="40" r="20" fill="#F4E6B4" />
            <polygon points="0,120 150,50 350,120" fill="#758C6E" />
            <polygon points="100,120 280,70 450,120" fill="#586E52" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-[#1E201D] dark:text-white mb-1">
          {businessName}
        </h2>
        <p className="text-sm text-[#8C9287] dark:text-[#9EA399] mb-2">
          {t("provider.accountDesc")}
        </p>
        <div className="flex text-[10px] text-[#63665E] dark:text-[#A5B29A] gap-2 font-medium">
          <span>{t("provider.greenSeal")}</span>
          <span>·</span>
          <span className="uppercase">{formatCategory(category)}</span>
          <span>·</span>
          <span>{borough}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { tab: "monitoreo" as const, label: t("provider.actionMon") },
          { tab: "nuevaExp" as const, label: t("provider.actionNew") },
          { tab: "solicitudes" as const, label: t("provider.actionAudits") },
          { tab: "mensajes" as const, label: t("provider.actionMessages") },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => onSelectTab(item.tab)}
            className="w-full bg-white dark:bg-[#2A312C] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] transition-colors"
          >
            <span className="text-base font-medium">{item.label}</span>
            <ArrowRight className="w-4 h-4 text-[#8C9287]" />
          </button>
        ))}
      </div>
    </div>
  );
}
