import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import nutsImg from "../../imports/nuts.png";
import eggsImg from "../../imports/eggs.png";
import shellfishImg from "../../imports/shellfish.png";
import soyImg from "../../imports/soy.png";

interface AllergiesPageProps {
  onNext: () => void;
  onBack: () => void;
}

const commonAllergies = [
  { id: "nuts", label: "Nuts", img: nutsImg, bg: "#fff5ef" },
  { id: "shellfish", label: "Shellfish", img: shellfishImg, bg: "#eef5fb" },
  { id: "soy", label: "Soy", img: soyImg, bg: "#fff8e8" },
  { id: "eggs", label: "Eggs", img: eggsImg, bg: "#fff8e8" },
];

export function AllergiesPage({ onNext, onBack }: AllergiesPageProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addCustom = () => {
    const val = inputValue.trim();
    if (!val || customAllergies.includes(val)) return;
    setCustomAllergies(prev => [...prev, val]);
    setInputValue("");
  };

  const removeCustom = (item: string) => {
    setCustomAllergies(prev => prev.filter(a => a !== item));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5ede8] px-6 py-10">
      <div className="w-full max-w-[360px] bg-[#fdf6f0] rounded-[40px] p-7 border border-[#ecddd6]">

        <div className="mb-1">
          <div className="w-8 h-8 rounded-full bg-[#F28155] flex items-center justify-center mb-5">
            <span className="text-white text-sm font-bold">3</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1a1a1a] tracking-tight mb-1">Allergies</h1>
          <p className="text-sm text-[#999] leading-relaxed mb-6">Tap to select. Your health is our priority.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {commonAllergies.map(item => {
            const isSelected = selected.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`bg-white rounded-[18px] border-[1.5px] p-5 flex flex-col items-center gap-3 cursor-pointer transition-all duration-150 ${
                  isSelected ? "border-[#F28155] shadow-sm" : "border-[#ecddd6]"
                }`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center relative" style={{ background: item.bg }}>
                  <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F28155] rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className={`text-sm font-semibold ${isSelected ? "text-[#F28155]" : "text-[#1a1a1a]"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom allergies */}
        <p className="text-[10px] font-bold text-[#bbb] uppercase tracking-widest mb-2.5">Other Allergies</p>

        {customAllergies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customAllergies.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 bg-[#fff5ef] border border-[#F28155] rounded-full px-3 py-1.5 text-xs font-semibold text-[#1a1a1a]"
              >
                {item}
                <button onClick={() => removeCustom(item)} className="text-[#F28155]">
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2.5 mb-6">
          <input
            type="text"
            placeholder="Add another..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustom()}
            className="flex-1 bg-white border border-[#ecddd6] rounded-2xl px-4 h-[50px] text-sm text-[#1a1a1a] outline-none placeholder-[#bbb]"
          />
          <button
            onClick={addCustom}
            className="w-[50px] h-[50px] bg-[#F28155] rounded-2xl flex items-center justify-center flex-shrink-0 active:opacity-90"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-[#F28155] text-white rounded-2xl h-[54px] text-base font-bold mb-3 active:opacity-90 transition-opacity"
        >
          Complete Setup
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
