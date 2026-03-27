"use client";

import { Category, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/firestore";
import CategoryIcon from "./CategoryIcon";

interface CategorySelectorProps {
  type: TransactionType;
  selected: Category | null;
  onSelect: (category: Category) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}

export default function CategorySelector({
  type, selected, onSelect, onSave, onBack, saving,
}: CategorySelectorProps) {
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isExpense = type === "expense";

  return (
    <div className="flex flex-col flex-1 px-6">
      <div className="flex-1 flex flex-col justify-center gap-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#3A3A4A] uppercase text-center">
          {isExpense ? "What did you spend on?" : "Where did it come from?"}
        </p>

        <div className="grid grid-cols-3 gap-2.5 stagger-children">
          {categories.map(({ label }) => {
            const isSelected = selected === label;
            return (
              <button
                key={label}
                onClick={() => onSelect(label as Category)}
                className={`fade-up flex flex-col items-center justify-center py-4 gap-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? isExpense
                      ? "bg-red-500 shadow-xl shadow-red-900/40"
                      : "bg-emerald-500 shadow-xl shadow-emerald-900/40"
                    : "bg-[#131318] border border-[#1F1F2A]"
                }`}
              >
                <CategoryIcon
                  category={label}
                  size={20}
                  color={isSelected ? "white" : "#4A4A5A"}
                  strokeWidth={1.8}
                />
                <span className={`text-[10px] font-semibold tracking-wide ${isSelected ? "text-white" : "text-[#4A4A5A]"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-8 flex gap-3">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-2xl bg-[#131318] border border-[#1F1F2A] flex items-center justify-center text-[#3A3A4A] active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={onSave}
          disabled={!selected || saving}
          className="flex-1 bg-indigo-600 text-white py-[18px] rounded-2xl font-semibold text-base disabled:opacity-20 transition-all duration-200 active:scale-[0.97] shadow-lg shadow-indigo-900/40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
