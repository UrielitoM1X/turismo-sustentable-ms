import { Experience } from "../../../api/services/catalogService";

export type RecommendationCategorySlug = "naturaleza" | "relax" | "cultura" | "mascotas";

export interface RecommendationCategoryConfig {
  slug: RecommendationCategorySlug;
  titleKey: string;
  matchesExperience: (exp: Experience) => boolean;
}

export interface CuratedDestination {
  slug: string;
  name: string;
  boroughKeywords: string[];
  size: string;
  top: string;
  left: string;
  bg: string;
  icon: boolean;
}

export const RECOMMENDATION_CATEGORIES: RecommendationCategoryConfig[] = [
  {
    slug: "naturaleza",
    titleKey: "recs.catNature",
    matchesExperience: (exp) => exp.category.toLowerCase() === "naturaleza",
  },
  {
    slug: "relax",
    titleKey: "recs.catRelax",
    matchesExperience: (exp) => exp.category.toLowerCase() === "viajes tranquilos",
  },
  {
    slug: "cultura",
    titleKey: "recs.catCulture",
    matchesExperience: (exp) =>
      exp.category.toLowerCase() === "cultura" || exp.category.toLowerCase() === "gastronomia",
  },
  {
    slug: "mascotas",
    titleKey: "recs.catPets",
    matchesExperience: (exp) => Boolean(exp.pet_friendly),
  },
];

export const CURATED_DESTINATIONS: CuratedDestination[] = [
  {
    slug: "milpa-alta",
    name: "Milpa Alta",
    boroughKeywords: ["milpa alta"],
    size: "w-24 h-24 lg:w-32 lg:h-32",
    top: "12%",
    left: "15%",
    bg: "bg-[#F2EFE9] dark:bg-[#18201C]",
    icon: false,
  },
  {
    slug: "xochimilco",
    name: "Xochimilco",
    boroughKeywords: ["xochimilco", "chinampa"],
    size: "w-40 h-40 lg:w-56 lg:h-56",
    top: "52%",
    left: "12%",
    bg: "bg-white dark:bg-[#252D28]",
    icon: true,
  },
  {
    slug: "bosque-de-tlalpan",
    name: "Bosque de Tlalpan",
    boroughKeywords: ["tlalpan"],
    size: "w-32 h-32 lg:w-44 lg:h-44",
    top: "22%",
    left: "30%",
    bg: "bg-[#E3E5D8] dark:bg-[#2A352F]",
    icon: true,
  },
  {
    slug: "cuemanco",
    name: "Cuemanco",
    boroughKeywords: ["cuemanco", "xochimilco"],
    size: "w-28 h-28 lg:w-36 lg:h-36",
    top: "68%",
    left: "33%",
    bg: "bg-[#C3CEB9] dark:bg-[#3B523E]",
    icon: true,
  },
  {
    slug: "los-dinamos",
    name: "Los Dinamos",
    boroughKeywords: ["magdalena contreras", "dinamos"],
    size: "w-24 h-24 lg:w-28 lg:h-28",
    top: "10%",
    left: "48%",
    bg: "bg-[#B0C49F] dark:bg-[#4B6846]",
    icon: false,
  },
  {
    slug: "ajusco",
    name: "Ajusco",
    boroughKeywords: ["ajusco", "tlalpan"],
    size: "w-44 h-44 lg:w-64 lg:h-64",
    top: "42%",
    left: "51%",
    bg: "bg-white dark:bg-[#252D28]",
    icon: true,
  },
  {
    slug: "desierto-de-los-leones",
    name: "Desierto de los Leones",
    boroughKeywords: ["cuajimalpa", "desierto"],
    size: "w-32 h-32 lg:w-40 lg:h-40",
    top: "64%",
    left: "71%",
    bg: "bg-[#B0C49F] dark:bg-[#4B6846]",
    icon: true,
  },
  {
    slug: "chapultepec",
    name: "Chapultepec",
    boroughKeywords: ["miguel hidalgo", "chapultepec"],
    size: "w-36 h-36 lg:w-48 lg:h-48",
    top: "18%",
    left: "73%",
    bg: "bg-[#E3E5D8] dark:bg-[#2A352F]",
    icon: true,
  },
  {
    slug: "cerro-de-la-estrella",
    name: "Cerro de la Estrella",
    boroughKeywords: ["iztapalapa", "estrella"],
    size: "w-24 h-24 lg:w-32 lg:h-32",
    top: "46%",
    left: "88%",
    bg: "bg-[#F2EFE9] dark:bg-[#18201C]",
    icon: false,
  },
];

export function findRecommendationCategory(
  slug?: string
): RecommendationCategoryConfig {
  return (
    RECOMMENDATION_CATEGORIES.find((c) => c.slug === slug) ||
    RECOMMENDATION_CATEGORIES[0]
  );
}

export function findCuratedDestination(slug?: string): CuratedDestination | null {
  if (!slug) return null;
  const normalized = decodeURIComponent(slug).toLowerCase();
  return CURATED_DESTINATIONS.find((d) => d.slug === normalized) || null;
}

export function matchesDestination(
  exp: Experience,
  destination: CuratedDestination
): boolean {
  const haystack = `${exp.borough_cdmx} ${exp.title} ${exp.sustainable_practices || ""}`.toLowerCase();
  return destination.boroughKeywords.some((kw) => haystack.includes(kw));
}
