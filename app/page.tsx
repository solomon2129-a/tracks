"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import CategoryIcon from "@/components/CategoryIcon";
import { addTransaction, TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES, subscribeToProfile, Account } from "@/lib/firestore";

type Step = 0 | 1 | 2 | 3;

const BTN_PRIMARY = {
  background: "#FFFFFF",
  color: "#000000",
} as const;

const BTN_DISABLED = {
  background: "rgba(255,255,255,0.07)",
  color: "#444",
} as const;

export default function HomePage() {
  const { userId, loading } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToProfile(userId, (profile) => {
        setAccounts(profile.accounts);
        if (!selectedAccount && profile.accounts.length > 0) {
          setSelectedAccount(profile.accounts[0].id);
        }
      });
      return unsubscribe;
    }
  }, [userId, selectedAccount]);

  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [step]);

  const goTo = useCallback((next: Step, dir: "forward" | "back") => {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setStep(next);
  }, []);

  const reset = useCallback(() => {
    setAmount("");
    setType(null);
    setCategory(null);
    setSelectedAccount(accounts.length > 0 ? accounts[0].id : "");
    setDirection("forward");
    setAnimKey(k => k + 1);
    setStep(0);
  }, [accounts]);

  const handleSave = async () => {
    if (!type || !category || !amount || !userId || !selectedAccount) return;
    setSaving(true);
    setSaveError(false);
    try {
      await addTransaction(userId, {
        amount: parseFloat(amount),
        type,
        category,
        accountId: selectedAccount,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); reset(); }, 1200);
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const isValid = !!amount && parseFloat(amount) > 0;
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedAccountName = accounts.find(a => a.id === selectedAccount)?.name || "Select Account";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="text-white text-xl font-bold">Add Transaction</p>
        <p className="text-[#555] text-sm mt-0.5">Log what you spent or received</p>
      </div>

      {/* Form card */}
      <div
        className="flex-1 flex flex-col mx-5 mb-24 rounded-2xl overflow-hidden"
        style={{ background: "#1A1A1A" }}
      >
        {/* Step dots */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-4">
          {[0, 1, 2, 3].map(s => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: s === step ? 20 : 7,
                height: 7,
                background: s <= step ? "#FFFFFF" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>

        {/* Animated content */}
        <div
          key={animKey}
          className={`flex-1 flex flex-col ${direction === "forward" ? "step-forward" : "step-back"}`}
        >
          {/* Step 0: Account Selection */}
          {step === 0 && (
            <div className="flex-1 flex flex-col px-6">
              <div className="flex-1 flex flex-col justify-center gap-3">
                <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase text-center mb-2">
                  Which account?
                </p>
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account.id);
                      goTo(1, "forward");
                    }}
                    className="rounded-2xl p-5 text-left active:scale-[0.98] transition-transform"
                    style={{
                      background: selectedAccount === account.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedAccount === account.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-lg font-bold mb-0.5">{account.name}</p>
                        <p className="text-[#555] text-sm">{account.type}</p>
                      </div>
                      <div className="text-2xl">{account.type === "bank" ? "🏦" : account.type === "cash" ? "💵" : "💳"}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Amount */}
          {step === 1 && (
            <div className="flex-1 flex flex-col px-6">
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase">Enter Amount</p>
                <div className="flex items-start justify-center mt-2">
                  <span className="text-[#555] text-3xl mt-3 mr-1 font-semibold">₹</span>
                  <input
                    ref={inputRef}
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => { const v = e.target.value; if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v); }}
                    onKeyDown={e => e.key === "Enter" && isValid && goTo(2, "forward")}
                    placeholder="0"
                    className="bg-transparent border-none outline-none text-center w-52"
                    style={{ fontSize: 64, fontWeight: 700, color: isValid ? "#fff" : "#2A2A2A" }}
                  />
                </div>
                <div
                  className="h-px w-44 rounded-full transition-all duration-500"
                  style={{ background: isValid ? "#FFFFFF" : "rgba(255,255,255,0.08)" }}
                />
              </div>
              <div className="pb-8">
                <button
                  onClick={() => goTo(2, "forward")}
                  disabled={!isValid}
                  className="w-full font-bold py-5 rounded-2xl text-base active:scale-[0.97] transition-all"
                  style={isValid ? BTN_PRIMARY : BTN_DISABLED}
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
                <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase text-center mb-2">
                  What was this?
                </p>
                <button
                  onClick={() => { setType("expense"); setCategory(null); goTo(3, "forward"); }}
                  className="rounded-2xl p-5 text-left active:scale-[0.98] transition-transform"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-lg font-bold mb-0.5">Spent</p>
                      <p className="text-[#555] text-sm">Money going out</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                      </svg>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setType("income"); setCategory(null); goTo(3, "forward"); }}
                  className="rounded-2xl p-5 text-left active:scale-[0.98] transition-transform"
                  style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-lg font-bold mb-0.5">Received</p>
                      <p className="text-[#555] text-sm">Money coming in</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
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
                <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase text-center">
                  {type === "expense" ? "Spent on?" : "Received from?"}
                </p>
                <div className="grid grid-cols-3 gap-2 stagger-children">
                  {categories.map(({ label }) => {
                    const isSelected = category === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setCategory(label as Category)}
                        className="fade-up flex flex-col items-center justify-center py-4 gap-2 rounded-2xl transition-all duration-150 active:scale-95"
                        style={{
                          background: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isSelected ? "#FFFFFF" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <CategoryIcon
                          category={label}
                          size={17}
                          color={isSelected ? "#000" : "#FFFFFF"}
                          strokeWidth={1.8}
                        />
                        <span
                          className="text-[10px] font-semibold tracking-wide"
                          style={{ color: isSelected ? "#000" : "#888" }}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {saveError && (
                <p className="text-[#F43F5E] text-xs text-center pb-2">Failed to save. Check your connection.</p>
              )}
              <div className="pb-8 flex gap-2">
                <button
                  onClick={() => goTo(2, "back")}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={handleSave}
                  disabled={!category || saving}
                  className="flex-1 font-bold py-4 rounded-2xl text-base active:scale-[0.97] transition-all"
                  style={saved ? { background: "#22C55E", color: "#fff" } : category ? BTN_PRIMARY : BTN_DISABLED}
                >
                  {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
