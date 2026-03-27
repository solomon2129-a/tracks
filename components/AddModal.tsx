"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { addTransaction, TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/firestore";
import CategoryIcon from "./CategoryIcon";

type Step = 1 | 2 | 3;

interface AddModalProps {
  userId: string;
  onClose: () => void;
}

export default function AddModal({ userId, onClose }: AddModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const goTo = useCallback((next: Step, dir: "forward" | "back") => {
    setDirection(dir);
    setAnimKey((k) => k + 1);
    setStep(next);
  }, []);

  const handleSave = async () => {
    if (!type || !category || !amount) return;
    setSaving(true);
    try {
      await addTransaction(userId, { amount: parseFloat(amount), type, category });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isValid = !!amount && parseFloat(amount) > 0;
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex flex-col max-w-md mx-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 fade-in" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative mt-auto bg-[#191E29] rounded-t-3xl flex flex-col modal-enter"
        style={{ minHeight: "85vh" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#2A3441] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-0.5 rounded-full transition-all duration-300"
                style={{
                  width: s === step ? 20 : 8,
                  background: s <= step ? "#01C38D" : "#2A3441",
                }}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#132046] flex items-center justify-center text-[#606E79]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step content */}
        <div
          key={animKey}
          className={`flex-1 flex flex-col ${direction === "forward" ? "step-forward" : "step-back"}`}
        >
          {/* Step 1: Amount */}
          {step === 1 && (
            <div className="flex-1 flex flex-col px-6">
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase">Amount</p>
                <div className="flex items-start justify-center">
                  <span className="text-[#606E79] text-3xl mt-2 mr-1">₹</span>
                  <input
                    ref={inputRef}
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && isValid && goTo(2, "forward")}
                    placeholder="0"
                    className="text-[64px] font-bold bg-transparent border-none outline-none text-white placeholder-[#2A3441] text-center w-52"
                  />
                </div>
                <div className="h-px w-40 bg-[#2A3441] relative">
                  <div
                    className="absolute inset-0 bg-[#01C38D] transition-all duration-300 origin-left"
                    style={{ transform: isValid ? "scaleX(1)" : "scaleX(0)", opacity: isValid ? 1 : 0 }}
                  />
                </div>
              </div>
              <div className="pb-8">
                <button
                  onClick={() => goTo(2, "forward")}
                  disabled={!isValid}
                  className="w-full bg-[#01C38D] text-[#191E29] font-bold py-[18px] rounded-2xl text-base disabled:opacity-20 active:scale-[0.97] transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Type */}
          {step === 2 && (
            <div className="flex-1 flex flex-col px-6">
              <div className="flex-1 flex flex-col justify-center gap-3">
                <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase text-center mb-3">
                  What was this?
                </p>
                <button
                  onClick={() => { setType("expense"); setCategory(null); goTo(3, "forward"); }}
                  className="bg-[#132046] border border-[#2A3441] rounded-3xl p-6 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xl font-bold mb-1">Spent</p>
                      <p className="text-[#606E79] text-sm">Money going out</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(255,90,95,0.1)] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                      </svg>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setType("income"); setCategory(null); goTo(3, "forward"); }}
                  className="bg-[#132046] border border-[#2A3441] rounded-3xl p-6 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xl font-bold mb-1">Received</p>
                      <p className="text-[#606E79] text-sm">Money coming in</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(1,195,141,0.1)] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#01C38D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
              <div className="pb-8">
                <button
                  onClick={() => goTo(1, "back")}
                  className="w-full border border-[#2A3441] text-[#606E79] font-semibold py-4 rounded-2xl text-sm active:scale-[0.97] transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Category */}
          {step === 3 && type && (
            <div className="flex-1 flex flex-col px-6">
              <div className="flex-1 flex flex-col justify-center gap-4">
                <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase text-center">
                  {type === "expense" ? "Spent on?" : "Received from?"}
                </p>
                <div className="grid grid-cols-3 gap-2 stagger-children">
                  {categories.map(({ label }) => {
                    const isSelected = category === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setCategory(label as Category)}
                        className={`fade-up flex flex-col items-center justify-center py-4 gap-2 rounded-2xl transition-all duration-150 active:scale-95 border ${
                          isSelected
                            ? "bg-[#01C38D] border-[#01C38D]"
                            : "bg-[#132046] border-[#2A3441]"
                        }`}
                      >
                        <CategoryIcon
                          category={label}
                          size={18}
                          color={isSelected ? "#191E29" : "#606E79"}
                          strokeWidth={1.8}
                        />
                        <span className={`text-[10px] font-semibold tracking-wide ${isSelected ? "text-[#191E29]" : "text-[#606E79]"}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pb-8 flex gap-2">
                <button
                  onClick={() => goTo(2, "back")}
                  className="w-12 h-12 rounded-2xl border border-[#2A3441] flex items-center justify-center text-[#606E79] active:scale-95 transition-transform flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={handleSave}
                  disabled={!category || saving}
                  className="flex-1 bg-[#01C38D] text-[#191E29] font-bold py-4 rounded-2xl text-base disabled:opacity-20 active:scale-[0.97] transition-all"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
