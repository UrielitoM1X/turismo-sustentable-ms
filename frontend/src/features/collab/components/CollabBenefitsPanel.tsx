import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, LineChart, Mail, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { ROUTES } from "../../../router/routes";

export default function CollabBenefitsPanel() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const benefits = [
    {
      icon: ShieldCheck,
      title: t("collab.benefit1Title"),
      desc: t("collab.benefit1Desc"),
    },
    {
      icon: Users,
      title: t("collab.benefit2Title"),
      desc: t("collab.benefit2Desc"),
    },
    {
      icon: LineChart,
      title: t("collab.benefit3Title"),
      desc: t("collab.benefit3Desc"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-7 shadow-sm border border-transparent dark:border-white/5 space-y-5">
        <h2 className="font-serif text-2xl text-[#1E201D] dark:text-white">
          {t("collab.benefitsTitle")}
        </h2>
        <div className="space-y-4">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#728C69]/15 text-[#728C69] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs sm:text-sm text-[#63665E] dark:text-[#9EA399] leading-relaxed">
                  <strong className="text-[#1E201D] dark:text-white">{item.title}: </strong>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#E3E5D8] dark:border-white/10">
          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#728C69] hover:bg-[#5B7153] text-white text-xs font-semibold py-3 px-4 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {t("collab.providerCta")}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#2A312C] rounded-[2rem] p-7 shadow-sm border border-transparent dark:border-white/5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#C81D77]/10 text-[#C81D77] flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <h3 className="font-serif text-xl text-[#1E201D] dark:text-white">
            {t("collab.directContactTitle")}
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#63665E] dark:text-[#9EA399] leading-relaxed">
          {t("collab.directContactDesc")}
        </p>
        <a
          href="mailto:alianzas@ecocdmx.org"
          className="inline-block font-semibold text-[#C81D77] dark:text-[#E24A96] hover:underline text-sm"
        >
          alianzas@ecocdmx.org
        </a>
      </div>
    </div>
  );
}
