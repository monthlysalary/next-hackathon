import { useState } from "react";
import { Check } from "lucide-react";

interface DietaryPageProps {
  onNext: () => void;
  onBack: () => void;
}

const options = [
  {
    id: "gluten",
    label: "Gluten Free",
    bg: "#fff5ef",
    icon: (
      <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
        <rect x="18" y="42" width="64" height="34" rx="10" fill="#c87533"/>
        <ellipse cx="50" cy="42" rx="32" ry="14" fill="#e8913d"/>
        <ellipse cx="50" cy="40" rx="28" ry="11" fill="#f0a84a"/>
        <line x1="20" y1="20" x2="80" y2="80" stroke="#e05a20" strokeWidth="7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "dairy",
    label: "Dairy Free",
    bg: "#eef5fb",
    icon: (
      <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
        <rect x="30" y="38" width="40" height="42" rx="4" fill="#c8dce8"/>
        <polygon points="30,38 50,22 70,38" fill="#a8c4d4"/>
        <rect x="34" y="50" width="32" height="4" rx="2" fill="white" opacity="0.5"/>
        <line x1="20" y1="20" x2="80" y2="80" stroke="#e05a20" strokeWidth="7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    bg: "#edf7f0",
    icon: (
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="68" rx="36" ry="10" fill="#7ec8b8"/>
        <path d="M14 60 Q14 82 50 82 Q86 82 86 60 Z" fill="#8ecfbf"/>
        <ellipse cx="50" cy="60" rx="36" ry="10" fill="#a8ddd0"/>
        <ellipse cx="38" cy="56" rx="10" ry="7" fill="#4a9e6a"/>
        <ellipse cx="55" cy="54" rx="9" ry="6" fill="#5db07a"/>
        <ellipse cx="48" cy="50" rx="8" ry="5" fill="#66bb85"/>
        <circle cx="44" cy="54" r="5" fill="#e84040"/>
        <circle cx="60" cy="57" r="4" fill="#e84040"/>
      </svg>
    ),
  },
  {
    id: "pescatarian",
    label: "Pescatarian",
    bg: "#eef3fb",
    icon: (
      <svg width="38" height="38" viewBox="0 0 100 100" fill="none">
        <ellipse cx="46" cy="50" rx="28" ry="16" fill="#7fa8cc"/>
        <ellipse cx="46" cy="50" rx="24" ry="12" fill="#8fbedd"/>
        <polygon points="75,50 88,38 88,62" fill="#6a94bb"/>
        <circle cx="28" cy="46" r="4" fill="white"/>
        <circle cx="27" cy="46" r="2" fill="#1a3a5c"/>
        <path d="M50 42 Q58 46 50 50" stroke="#5a88b0" strokeWidth="1.5" fill="none"/>
        <path d="M58 44 Q66 48 58 52" stroke="#5a88b0" strokeWidth="1.5" fill="none"/>
        <path d="M40 38 Q50 30 60 38" stroke="#6a94bb" strokeWidth="2.5" fill="none"/>
      </svg>
    ),
  },
  {
    id: "halal",
    label: "Halal",
    bg: "#eef8f2",
    icon: (
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
        <polygon points="50,10 58,35 82,28 65,48 88,58 63,62 68,88 50,72 32,88 37,62 12,58 35,48 18,28 42,35" fill="url(#hg)"/>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ecb7a"/>
            <stop offset="100%" stopColor="#2e9e52"/>
          </linearGradient>
        </defs>
        <text x="50" y="54" fontSize="10" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold">حلال</text>
        <text x="50" y="64" fontSize="7" textAnchor="middle" fill="white" fontFamily="sans-serif" letterSpacing="1">HALAL</text>
      </svg>
    ),
  },
  {
    id: "kosher",
    label: "Kosher",
    bg: "#eff2fb",
    icon: (
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
        <polygon points="50,12 62,34 86,34 68,52 76,76 50,62 24,76 32,52 14,34 38,34" fill="none" stroke="#3a6fcc" strokeWidth="3"/>
        <polygon points="50,88 38,66 14,66 32,48 24,24 50,38 76,24 68,48 86,66 62,66" fill="none" stroke="#3a6fcc" strokeWidth="3"/>
        <circle cx="50" cy="8" r="2.5" fill="#c8a835"/>
        <circle cx="92" cy="50" r="2.5" fill="#c8a835"/>
        <circle cx="50" cy="92" r="2.5" fill="#c8a835"/>
        <circle cx="8" cy="50" r="2.5" fill="#c8a835"/>
      </svg>
    ),
  },
];

export function DietaryPage({ onNext, onBack }: DietaryPageProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5ede8] px-6 py-10">
      <div className="w-full max-w-[360px] bg-[#fdf6f0] rounded-[40px] p-7 border border-[#ecddd6]">

        <div className="mb-1">
          <div className="w-8 h-8 rounded-full bg-[#F28155] flex items-center justify-center mb-5">
            <span className="text-white text-sm font-bold">2</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Dietary Restrictions</h1>
          <p className="text-sm text-[#999] leading-relaxed mb-6">Help your friends accommodate your dining needs and preferences.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {options.map(opt => {
            const isSelected = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={`bg-white rounded-[18px] border-[1.5px] p-5 flex flex-col items-center gap-3 cursor-pointer transition-all duration-150 ${
                  isSelected ? "border-[#F28155] shadow-sm" : "border-[#ecddd6]"
                }`}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center relative"
                  style={{ background: opt.bg }}
                >
                  {opt.icon}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F28155] rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={`text-[13px] font-semibold ${isSelected ? "text-[#F28155]" : "text-[#1a1a1a]"}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onNext}
          className="w-full bg-[#F28155] text-white rounded-2xl h-[54px] text-base font-bold mb-3 active:opacity-90 transition-opacity"
        >
          Save Preferences
        </button>

        <button
          onClick={onBack}
          className="w-full text-sm text-[#bbb] text-center py-1 active:text-[#999]"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
