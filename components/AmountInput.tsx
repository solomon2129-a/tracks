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
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      onChange(val);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value && parseFloat(value) > 0) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 gap-10">
      <div className="text-center">
        <p className="text-gray-400 text-sm font-medium tracking-widest uppercase mb-8">Amount</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl font-light text-gray-300">₹</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            placeholder="0"
            className="text-6xl font-bold text-gray-900 bg-transparent border-none outline-none w-48 text-center placeholder-gray-200"
          />
        </div>
        <div className="h-0.5 w-48 bg-gray-100 mx-auto mt-4" />
      </div>

      <button
        onClick={onNext}
        disabled={!value || parseFloat(value) <= 0}
        className="w-full max-w-xs bg-indigo-600 text-white text-lg font-semibold py-4 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
      >
        Next
      </button>
    </div>
  );
}
