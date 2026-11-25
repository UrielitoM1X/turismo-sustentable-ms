import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCatalog } from "../../../context/CatalogContext";
import { useModals } from "../../../context/ModalContext";
import { useLanguage } from "../../../i18n/LanguageContext";
import ExperienceCard from "../components/ExperienceCard";
import { useCatalogFilters } from "../hooks/useCatalogFilters";

export default function CatalogPage() {
  const { t } = useLanguage();
  const { canReserve } = useAuth();
  const { experiences, isFavorite, toggleFavorite } = useCatalog();
  const { openCheckout, openDetail } = useModals();

  const {
    searchText,
    setSearchText,
    categoryFilter,
    setCategoryFilter,
    onlyPetFriendly,
    togglePetFriendly,
    onlyAccessible,
    toggleAccessible,
    filteredExperiences,
  } = useCatalogFilters(experiences);

  const categoryOptions = [
    { value: "Todas", label: t("catalog.catAll") },
    { value: "Naturaleza", label: t("catalog.catNature") },
    { value: "Cultura", label: t("catalog.catCulture") },
    { value: "Viajes Tranquilos", label: t("catalog.catRelax") },
    { value: "Gastronomia", label: t("catalog.catGastronomy") },
  ];

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <span className="text-xs font-bold tracking-[0.2em] text-[#728C69] uppercase">
          {t("catalog.badge")}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl mt-1">{t("catalog.title")}</h1>
      </div>

      <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-4 sm:p-5 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder={t("catalog.searchPlaceholder")}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full md:w-80 bg-[#F2EFE9] dark:bg-[#18201C] rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#728C69]"
        />

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categoryOptions.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                categoryFilter === cat.value
                  ? "bg-[#728C69] text-white"
                  : "bg-[#F2EFE9] dark:bg-[#18201C] hover:bg-[#E3E5D8]"
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={togglePetFriendly}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              onlyPetFriendly
                ? "bg-[#C81D77] text-white"
                : "bg-[#F2EFE9] dark:bg-[#18201C]"
            }`}
          >
            {t("common.petFriendly")}
          </button>
          <button
            onClick={toggleAccessible}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              onlyAccessible
                ? "bg-[#C81D77] text-white"
                : "bg-[#F2EFE9] dark:bg-[#18201C]"
            }`}
          >
            {t("common.accessible")}
          </button>
        </div>
      </div>

      {filteredExperiences.length === 0 ? (
        <div className="bg-white dark:bg-[#2A312C] rounded-3xl p-10 text-center">
          <p className="text-sm text-muted-foreground">{t("catalog.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map((exp) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              isFavorite={isFavorite(exp.id)}
              canReserve={canReserve}
              onToggleFavorite={toggleFavorite}
              onReserve={openCheckout}
              onViewDetail={openDetail}
            />
          ))}
        </div>
      )}
    </main>
  );
}
