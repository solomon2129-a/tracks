"use client";

import { Category, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/firestore";

interface CategorySelectorProps {
  type: TransactionType;
  selected: Category | null;
  onSelect: (category: Category) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}

export default function CategorySelector({
  type,
  selected,
  onSelect,
  onSave,
  onBack,
  saving,
}: CategorySelectorProps) {
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const accentColor = type === "expense" ? "red" : "emerald";

  return (
    <div className="flex flex-col flex-1 px-6">
      <div className="flex-1 flex flex-col justify-center gap-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase text-center">
          {type === "expense" ? "What did you spend on?" : "Where did it come from?"}
        </p>

        <div className="grid grid-cols-3 gap-3 stagger-children">
          {categories.map(({ label, emoji }) => {
            const isSelected = selected === label;
            return (
              <button
                key={label}
                onClick={() => onSelect(label as Category)}
                className={`fade-up flex flex-col items-center justify-center py-5 rounded-3xl gap-2 transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? accentColor === "red"
                      ? "bg-red-500 shadow-lg shadow-red-200"
                      : "bg-emerald-500 shadow-lg shadow-emerald-200"
                    : "bg-gray-50 border-2 border-gray-100"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-600"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="pb-8 flex gap-3">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-400 active:scale-95 transition-transform"
        >
          ←
        </button>
        <button
          onClick={onSave}
          disabled={!selected || saving}
          className="flex-1 bg-gray-900 text-white py-[18px] rounded-2xl font-semibold text-base disabled:opacity-20 transition-all duration-200 active:scale-[0.97]"
        >
          {saving ? "Saving…" : "Save ✓"}
        </button>
      </div>
    </div>
  );
}
