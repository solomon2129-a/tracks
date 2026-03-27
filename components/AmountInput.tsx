"use client";

import { useEffect, useRef } from "react";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export default function AmountInput({ value, onChange, onNext }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) onChange(val);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value && parseFloat(value) > 0) onNext();
  };

  const isValid = !!value && parseFloat(value) > 0;

  return (
    <div className="flex flex-col flex-1 px-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#3A3A4A] uppercase">Amount</p>

        <div className="flex items-center justify-center">
          <span className="text-4xl font-light text-[#3A3A4A] mr-1 mb-1">₹</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="0"
            className="text-7xl font-bold bg-transparent border-none outline-none text-center text-white placeholder-[#2A2A38] max-w-[220px]"
          />
        </div>

        {/* Underline */}
        <div className="relative h-px w-48">
          <div className="absolute inset-0 bg-[#1F1F2A] rounded-full" />
          <div
            className="absolute inset-0 bg-indigo-500 rounded-full transition-all duration-300 origin-left"
            style={{ transform: isValid ? "scaleX(1)" : "scaleX(0.3)", opacity: isValid ? 1 : 0.3 }}
          />
        </div>
      </div>

      <div className="pb-8">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full bg-indigo-600 text-white text-base font-semibold py-[18px] rounded-2xl disabled:opacity-20 transition-all duration-200 active:scale-[0.97] active:bg-indigo-700 shadow-lg shadow-indigo-900/40"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
