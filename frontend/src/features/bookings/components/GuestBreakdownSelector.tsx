import React from "react";
import {
  GUEST_RATE_MULTIPLIERS,
  GuestBreakdown,
  GuestType,
} from "../../../api/services/bookingService";
import { useLanguage } from "../../../i18n/LanguageContext";

interface GuestBreakdownSelectorProps {
  breakdown: GuestBreakdown;
  unitPrice: number;
  totalGuests: number;
  maxCap: number;
  disabled: boolean;
  onIncrement: (type: GuestType) => void;
  onDecrement: (type: GuestType) => void;
}

const GUEST_ROWS: {
  type: GuestType;
  labelKey: string;
  hintKey: string;
  discountBadgeKey?: string;
}[] = [
  {
    type: "adults",
    labelKey: "checkout.guestAdults",
    hintKey: "checkout.guestAdultsHint",
  },
  {
    type: "children",
    labelKey: "checkout.guestChildren",
    hintKey: "checkout.guestChildrenHint",
    discountBadgeKey: "checkout.discount50",
  },
  {
    type: "seniors",
    labelKey: "checkout.guestSeniors",
    hintKey: "checkout.guestSeniorsHint",
    discountBadgeKey: "checkout.discount30",
  },
  {
    type: "students",
    labelKey: "checkout.guestStudents",
    hintKey: "checkout.guestStudentsHint",
    discountBadgeKey: "checkout.discount20",
  },
];

export default function GuestBreakdownSelector({
  breakdown,
  unitPrice,
  totalGuests,
  maxCap,
  disabled,
  onIncrement,
  onDecrement,
}: GuestBreakdownSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium">{t("checkout.guestTypesTitle")}</label>
        <span className="text-[11px] font-semibold text-[#728C69]">
          {t("checkout.guestsSelected", { total: totalGuests, max: maxCap })}
        </span>
      </div>

      <div className="space-y-2 bg-[#F2EFE9] dark:bg-[#18201C] rounded-2xl p-3">
        {GUEST_ROWS.map((row) => {
          const count = breakdown[row.type];
          const typePrice = Number((unitPrice * GUEST_RATE_MULTIPLIERS[row.type]).toFixed(2));
          const canDecrement = !disabled && count > 0 && totalGuests > 1;
          const canIncrement = !disabled && totalGuests < maxCap;

          return (
            <div
              key={row.type}
              className="flex items-center justify-between gap-3 bg-white dark:bg-[#2A312C] rounded-xl px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">{t(row.labelKey)}</span>
                  {row.discountBadgeKey && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#728C69]/15 text-[#728C69] dark:text-[#A5B29A]">
                      {t(row.discountBadgeKey)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t(row.hintKey)} · ${typePrice.toFixed(0)} {t("common.mxn")}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={!canDecrement}
                  onClick={() => onDecrement(row.type)}
                  aria-label={`Remove ${row.type}`}
                  className="w-7 h-7 rounded-full bg-[#F2EFE9] dark:bg-[#18201C] text-sm font-bold flex items-center justify-center hover:bg-[#E3E5D8] dark:hover:bg-[#3D453F] disabled:opacity-40 transition"
                >
                  −
                </button>
                <span className="w-5 text-center text-xs font-bold">{count}</span>
                <button
                  type="button"
                  disabled={!canIncrement}
                  onClick={() => onIncrement(row.type)}
                  aria-label={`Add ${row.type}`}
                  className="w-7 h-7 rounded-full bg-[#728C69] text-white text-sm font-bold flex items-center justify-center hover:bg-[#5B7153] disabled:opacity-40 transition"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
