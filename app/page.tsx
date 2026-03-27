"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginScreen from "@/components/LoginScreen";
import AmountInput from "@/components/AmountInput";
import TypeSelector from "@/components/TypeSelector";
import CategorySelector from "@/components/CategorySelector";
import BottomNav from "@/components/BottomNav";
import { addTransaction, TransactionType, Category } from "@/lib/firestore";

type Step = 1 | 2 | 3;

export default function AddPage() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const goTo = useCallback((next: Step, dir: "forward" | "back") => {
    setDirection(dir);
    setAnimKey((k) => k + 1);
    setStep(next);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const reset = () => {
    setAmount("");
    setType(null);
    setCategory(null);
    goTo(1, "back");
  };

  const handleSave = async () => {
    if (!user || !type || !category || !amount) return;
    setSaving(true);
    try {
      await addTransaction(user.uid, {
        amount: parseFloat(amount),
        type,
        category,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      reset();
    } finally {
      setSaving(false);
    }
  };

  const handleTypeSelect = (t: TransactionType) => {
    setType(t);
    // Clear category if type changes
    setCategory(null);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-white">
      {/* Header with step indicator */}
      <div className="pt-16 px-6 pb-4">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-400"
              style={{
                width: s === step ? 28 : 12,
                background: s === step ? "#111827" : s < step ? "#9CA3AF" : "#E5E7EB",
              }}
            />
          ))}
          <span className="ml-auto text-xs font-medium text-gray-300">
            {step} / 3
          </span>
        </div>
      </div>

      {/* Animated step content */}
      <div
        key={animKey}
        className={`flex-1 flex flex-col ${direction === "forward" ? "step-forward" : "step-back"}`}
      >
        {step === 1 && (
          <AmountInput
            value={amount}
            onChange={setAmount}
            onNext={() => goTo(2, "forward")}
          />
        )}
        {step === 2 && (
          <TypeSelector
            selected={type}
            onSelect={handleTypeSelect}
            onNext={() => goTo(3, "forward")}
            onBack={() => goTo(1, "back")}
          />
        )}
        {step === 3 && type && (
          <CategorySelector
            type={type}
            selected={category}
            onSelect={setCategory}
            onSave={handleSave}
            onBack={() => goTo(2, "back")}
            saving={saving}
          />
        )}
      </div>

      {/* Success toast */}
      {saved && (
        <div className="toast-in fixed top-8 left-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2">
          <span className="text-base">✓</span> Saved!
        </div>
      )}

      <BottomNav />
    </div>
  );
}
