"use client";

import { Category } from "@/lib/firestore";

const CATEGORIES: { label: Category; emoji: string }[] = [
  { label: "Food", emoji: "🍔" },
  { label: "Travel", emoji: "✈️" },
  { label: "Bills", emoji: "📄" },
  { label: "Lifestyle", emoji: "✨" },
  { label: "Other", emoji: "📦" },
];

interface CategorySelectorProps {
  selected: Category | null;
  onSelect: (category: Category) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
}

export default function CategorySelector({
  selected,
  onSelect,
  onSave,
  onBack,
  saving,
}: CategorySelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 gap-10">
      <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Category</p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {CATEGORIES.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className={`flex flex-col items-center justify-center py-4 rounded-2xl gap-2 transition-all active:scale-95 ${
              selected === label
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-gray-50 text-gray-700 border-2 border-gray-100"
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-semibold active:scale-95 transition-transform"
        >
          Back
        </button>
        <button
          onClick={onSave}
          disabled={!selected || saving}
          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
