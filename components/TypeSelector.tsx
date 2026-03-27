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
    <div className="flex flex-col flex-1 px-6">
      <div className="flex-1 flex flex-col justify-center gap-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#3A3A4A] uppercase text-center mb-2">
          What was this?
        </p>

        {/* Spent */}
        <button
          onClick={() => onSelect("expense")}
          className={`relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-200 active:scale-[0.97] ${
            selected === "expense"
              ? "bg-red-500 shadow-2xl shadow-red-900/50"
              : "bg-[#131318] border border-[#1F1F2A]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold mb-1 ${selected === "expense" ? "text-white" : "text-white"}`}>
                Spent
              </p>
              <p className={`text-sm ${selected === "expense" ? "text-red-100" : "text-[#3A3A4A]"}`}>
                Money going out
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
              selected === "expense" ? "bg-white/20" : "bg-[#1A1A24]"
            }`}>
              💸
            </div>
          </div>
          {selected === "expense" && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </button>

        {/* Received */}
        <button
          onClick={() => onSelect("income")}
          className={`relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-200 active:scale-[0.97] ${
            selected === "income"
              ? "bg-emerald-500 shadow-2xl shadow-emerald-900/50"
              : "bg-[#131318] border border-[#1F1F2A]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white mb-1">Received</p>
              <p className={`text-sm ${selected === "income" ? "text-emerald-100" : "text-[#3A3A4A]"}`}>
                Money coming in
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
              selected === "income" ? "bg-white/20" : "bg-[#1A1A24]"
            }`}>
              💰
            </div>
          </div>
          {selected === "income" && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </button>
      </div>

      <div className="pb-8 flex gap-3">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-2xl bg-[#131318] border border-[#1F1F2A] flex items-center justify-center text-[#3A3A4A] active:scale-95 transition-transform"
        >
          ←
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 bg-indigo-600 text-white py-[18px] rounded-2xl font-semibold text-base disabled:opacity-20 transition-all duration-200 active:scale-[0.97] shadow-lg shadow-indigo-900/40"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
