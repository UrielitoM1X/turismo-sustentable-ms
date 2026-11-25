export const CDMX_BOROUGH_COORDS: Record<string, { lat: number; lng: number }> = {
  "Alvaro Obregon": { lat: 19.3587, lng: -99.2033 },
  Azcapotzalco: { lat: 19.4869, lng: -99.1859 },
  "Benito Juarez": { lat: 19.3719, lng: -99.1578 },
  Coyoacan: { lat: 19.3467, lng: -99.1617 },
  "Cuajimalpa de Morelos": { lat: 19.3574, lng: -99.2998 },
  Cuauhtemoc: { lat: 19.4414, lng: -99.1518 },
  "Gustavo A. Madero": { lat: 19.4829, lng: -99.1135 },
  Iztacalco: { lat: 19.3958, lng: -99.0977 },
  Iztapalapa: { lat: 19.3574, lng: -99.0671 },
  "La Magdalena Contreras": { lat: 19.3143, lng: -99.2417 },
  "Miguel Hidalgo": { lat: 19.4079, lng: -99.1917 },
  "Milpa Alta": { lat: 19.1923, lng: -99.0231 },
  Tlahuac: { lat: 19.2869, lng: -99.0052 },
  Tlalpan: { lat: 19.2886, lng: -99.1672 },
  "Venustiano Carranza": { lat: 19.4194, lng: -99.1138 },
  Xochimilco: { lat: 19.2647, lng: -99.1036 },
};

export const CDMX_BOROUGHS = Object.keys(CDMX_BOROUGH_COORDS);

export const CATALOG_CATEGORIES = [
  "Naturaleza",
  "Gastronomia",
  "Cultura",
  "Viajes Tranquilos",
] as const;
