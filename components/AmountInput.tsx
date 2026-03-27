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

  const display = value || "0";
  const isValid = !!value && parseFloat(value) > 0;

  return (
    <div className="flex flex-col flex-1 px-6">
      {/* Amount display area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">Amount</p>

        <div className="relative flex items-center justify-center w-full">
          <span className="text-4xl font-light text-gray-300 mr-1 mb-1">₹</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="0"
            className="text-7xl font-bold bg-transparent border-none outline-none text-center text-gray-900 placeholder-gray-200 max-w-[200px]"
          />
        </div>

        {/* Animated underline */}
        <div className="relative h-px w-48">
          <div className="absolute inset-0 bg-gray-100 rounded-full" />
          <div
            className="absolute inset-0 bg-indigo-500 rounded-full transition-all duration-300 origin-left"
            style={{ transform: isValid ? "scaleX(1)" : "scaleX(0.3)", opacity: isValid ? 1 : 0.3 }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="pb-8">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-full bg-gray-900 text-white text-base font-semibold py-[18px] rounded-2xl disabled:opacity-20 transition-all duration-200 active:scale-[0.97] active:bg-gray-800"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
