import React from "react";
import { RecommendationCategorySlug } from "../data/categories";

interface CategoryIllustrationProps {
  slug: RecommendationCategorySlug;
}

export default function CategoryIllustration({ slug }: CategoryIllustrationProps) {
  switch (slug) {
    case "naturaleza":
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
          <rect width="400" height="240" fill="#B4CBB0" />
          <circle cx="320" cy="60" r="30" fill="#F4E6B4" />
          <polygon
            points="-20,200 20,80 60,200 100,60 140,200 180,90 220,200 260,70 300,200 340,100 380,200 420,80"
            fill="#758C6E"
          />
          <polygon
            points="0,200 40,100 80,200 120,80 160,200 200,110 240,200 280,90 320,200 360,120 400,200"
            fill="#4B5E45"
          />
          <rect y="190" width="400" height="50" fill="#3D4B38" />
        </svg>
      );
    case "relax":
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
          <rect width="400" height="240" fill="#E2D6B5" />
          <circle cx="280" cy="60" r="30" fill="#F4E6B4" />
          <polygon points="-50,150 120,80 250,150 350,100 450,150" fill="#A1B39D" />
          <rect y="150" width="400" height="90" fill="#7BA2A2" />
          <path d="M0,170 Q100,190 200,170 T400,170" fill="none" stroke="#FFFFFF" strokeWidth="3" />
          <path
            d="M0,200 Q100,220 200,200 T400,200"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            opacity="0.6"
          />
        </svg>
      );
    case "cultura":
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
          <rect width="400" height="240" fill="#E2D6B5" />
          <circle cx="320" cy="60" r="30" fill="#F4E6B4" />
          <polygon points="-20,180 100,110 200,180 300,120 420,180" fill="#A1B39D" />
          <rect x="160" y="80" width="80" height="100" fill="#B3866A" />
          <rect x="130" y="110" width="140" height="70" fill="#B3866A" />
          <rect x="100" y="140" width="200" height="40" fill="#B3866A" />
          <rect x="70" y="170" width="260" height="10" fill="#B3866A" />
          <rect y="180" width="400" height="60" fill="#758C6E" />
        </svg>
      );
    case "mascotas":
      return (
        <svg viewBox="0 0 400 240" className="w-full h-full object-cover">
          <rect width="400" height="240" fill="#B4CBB0" />
          <circle cx="340" cy="60" r="30" fill="#F4E6B4" />
          <polygon points="-50,200 100,80 250,200 350,110 450,200" fill="#758C6E" />
          <polygon points="-20,200 60,120 160,200 260,90 380,200" fill="#586E52" />
          <polygon points="10,200 30,150 50,200" fill="#3D4B38" />
          <polygon points="40,200 55,165 70,200" fill="#3D4B38" />
          <polygon points="330,200 350,140 370,200" fill="#3D4B38" />
          <polygon points="160,200 200,130 240,200" fill="#F4E6B4" />
          <polygon points="195,200 200,150 205,200" fill="#3D4B38" />
        </svg>
      );
  }
}
