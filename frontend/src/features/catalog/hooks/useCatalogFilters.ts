import { useMemo, useState } from "react";
import { Experience } from "../../../api/services/catalogService";

export function useCatalogFilters(experiences: Experience[]) {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [onlyPetFriendly, setOnlyPetFriendly] = useState(false);
  const [onlyAccessible, setOnlyAccessible] = useState(false);

  const filteredExperiences = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return experiences.filter((exp) => {
      const matchesSearch =
        !query ||
        exp.title.toLowerCase().includes(query) ||
        exp.borough_cdmx.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "Todas" ||
        exp.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesPet = !onlyPetFriendly || Boolean(exp.pet_friendly);
      const matchesAccess = !onlyAccessible || Boolean(exp.accessible);
      return matchesSearch && matchesCategory && matchesPet && matchesAccess;
    });
  }, [experiences, searchText, categoryFilter, onlyPetFriendly, onlyAccessible]);

  return {
    searchText,
    setSearchText,
    categoryFilter,
    setCategoryFilter,
    onlyPetFriendly,
    togglePetFriendly: () => setOnlyPetFriendly((prev) => !prev),
    onlyAccessible,
    toggleAccessible: () => setOnlyAccessible((prev) => !prev),
    filteredExperiences,
  };
}
