"use client";

import { useState } from "react";
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
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const reset = () => {
    setStep(1);
    setAmount("");
    setType(null);
    setCategory(null);
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
      setTimeout(() => setSaved(false), 1500);
      reset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <div className="pt-14 pb-4 px-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-indigo-600" : s < step ? "w-4 bg-indigo-300" : "w-4 bg-gray-100"
              }`}
            />
          ))}
        </div>
      </div>

      {saved && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg z-50">
          Saved!
        </div>
      )}

      {step === 1 && (
        <AmountInput value={amount} onChange={setAmount} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <TypeSelector
          selected={type}
          onSelect={setType}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <CategorySelector
          selected={category}
          onSelect={setCategory}
          onSave={handleSave}
          onBack={() => setStep(2)}
          saving={saving}
        />
      )}

      <BottomNav />
    </div>
  );
}
