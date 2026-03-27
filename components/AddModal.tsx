"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { addTransaction, TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/firestore";
import CategoryIcon, { getCategoryColor } from "./CategoryIcon";

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
    const t = setTimeout(() => inputRef.current?.focus(), 120);
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
      <div
        className="absolute inset-0 fade-in"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative mt-auto rounded-t-[28px] flex flex-col modal-enter"
        style={{ minHeight: "82vh", background: "#0F1623" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Step dots + close */}
        <div className="flex items-center justify-between px-6 pt-2 pb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: s === step ? 24 : 8,
                  height: 8,
                  background: s <= step ? "#01C38D" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.08)", color: "#7A8EA0" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Animated content */}
        <div
          key={animKey}
          className={`flex-1 flex flex-col ${direction === "forward" ? "step-forward" : "step-back"}`}
        >
          {/* Step 1: Amount */}
          {step === 1 && (
            <div className="flex-1 flex flex-col px-6">
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase">Enter Amount</p>
                <div className="flex items-start justify-center mt-2">
                  <span className="text-[#7A8EA0] text-3xl mt-3 mr-1 font-semibold">₹</span>
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
                    className="bg-transparent border-none outline-none text-center w-52"
                    style={{
                      fontSize: 64,
                      fontWeight: 700,
                      color: isValid ? "#fff" : "#2A3D52",
                    }}
                  />
                </div>
                <div className="h-px w-44 rounded-full transition-all duration-500" style={{
                  background: isValid ? "#01C38D" : "rgba(255,255,255,0.08)"
                }} />
              </div>
              <div className="pb-8">
                <button
                  onClick={() => goTo(2, "forward")}
                  disabled={!isValid}
                  className="w-full font-bold py-5 rounded-2xl text-base active:scale-[0.97] transition-all"
                  style={{
                    background: isValid ? "linear-gradient(135deg,#01C38D,#00A070)" : "rgba(255,255,255,0.06)",
                    color: isValid ? "#fff" : "#3D5166",
                    boxShadow: isValid ? "0 4px 20px rgba(1,195,141,0.35)" : "none",
                  }}
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
                <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase text-center mb-2">
                  What was this?
                </p>

                <button
                  onClick={() => { setType("expense"); setCategory(null); goTo(3, "forward"); }}
                  className="rounded-3xl p-6 text-left active:scale-[0.98] transition-transform"
                  style={{ background: "rgba(255,90,95,0.08)", border: "1px solid rgba(255,90,95,0.2)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xl font-bold mb-1">Spent</p>
                      <p className="text-[#7A8EA0] text-sm">Money going out</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,90,95,0.15)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5A5F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                      </svg>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setType("income"); setCategory(null); goTo(3, "forward"); }}
                  className="rounded-3xl p-6 text-left active:scale-[0.98] transition-transform"
                  style={{ background: "rgba(1,195,141,0.08)", border: "1px solid rgba(1,195,141,0.2)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xl font-bold mb-1">Received</p>
                      <p className="text-[#7A8EA0] text-sm">Money coming in</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(1,195,141,0.15)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#01C38D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>

              <div className="pb-8">
                <button
                  onClick={() => goTo(1, "back")}
                  className="w-full py-4 rounded-2xl text-sm font-semibold active:scale-[0.97] transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#7A8EA0" }}
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
                <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase text-center">
                  {type === "expense" ? "Spent on?" : "Received from?"}
                </p>
                <div className="grid grid-cols-3 gap-2.5 stagger-children">
                  {categories.map(({ label }) => {
                    const isSelected = category === label;
                    const color = getCategoryColor(label);
                    return (
                      <button
                        key={label}
                        onClick={() => setCategory(label as Category)}
                        className="fade-up flex flex-col items-center justify-center py-4 gap-2 rounded-2xl transition-all duration-150 active:scale-95"
                        style={{
                          background: isSelected ? color : "rgba(255,255,255,0.05)",
                          border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.07)"}`,
                          boxShadow: isSelected ? `0 4px 16px ${color}44` : "none",
                        }}
                      >
                        <CategoryIcon
                          category={label}
                          size={18}
                          color={isSelected ? "#fff" : color}
                          strokeWidth={1.8}
                        />
                        <span
                          className="text-[10px] font-semibold tracking-wide"
                          style={{ color: isSelected ? "#fff" : "#7A8EA0" }}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pb-8 flex gap-2.5">
                <button
                  onClick={() => goTo(2, "back")}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#7A8EA0" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={handleSave}
                  disabled={!category || saving}
                  className="flex-1 font-bold py-4 rounded-2xl text-base active:scale-[0.97] transition-all"
                  style={{
                    background: category ? "linear-gradient(135deg,#01C38D,#00A070)" : "rgba(255,255,255,0.06)",
                    color: category ? "#fff" : "#3D5166",
                    boxShadow: category ? "0 4px 20px rgba(1,195,141,0.35)" : "none",
                  }}
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
