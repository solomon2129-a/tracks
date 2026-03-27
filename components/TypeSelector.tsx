"use client";

import { TransactionType } from "@/lib/firestore";

interface TypeSelectorProps {
  selected: TransactionType | null;
  onSelect: (type: TransactionType) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TypeSelector({ selected, onSelect, onNext, onBack }: TypeSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 gap-10">
      <div className="text-center">
        <p className="text-gray-400 text-sm font-medium tracking-widest uppercase mb-2">What was this?</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelect("expense")}
          className={`py-5 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
            selected === "expense"
              ? "bg-red-500 text-white shadow-lg shadow-red-200"
              : "bg-gray-50 text-gray-700 border-2 border-gray-100"
          }`}
        >
          Spent
        </button>
        <button
          onClick={() => onSelect("income")}
          className={`py-5 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
            selected === "income"
              ? "bg-green-500 text-white shadow-lg shadow-green-200"
              : "bg-gray-50 text-gray-700 border-2 border-gray-100"
          }`}
        >
          Received
        </button>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-semibold active:scale-95 transition-transform"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          Next
        </button>
      </div>
    </div>
  );
}
