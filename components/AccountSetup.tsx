"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateAccounts, AccountType, ACCOUNT_TYPES, Account } from "@/lib/firestore";

interface AccountSetupProps {
  onComplete: () => void;
}

export default function AccountSetup({ onComplete }: AccountSetupProps) {
  const { userId } = useAuth();
  const [step, setStep] = useState<"count" | "setup">("count");
  const [accountCount, setAccountCount] = useState(2);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);

  const handleStartSetup = () => {
    setAccounts(
      Array.from({ length: accountCount }, (_, i) => ({
        id: `account_${i}`,
        name: "",
        type: (["bank", "cash"] as AccountType[])[i] || "other",
        balance: 0,
        currency: "USD",
      }))
    );
    setStep("setup");
  };

  const updateAccount = (index: number, field: string, value: any) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    setAccounts(updated);
  };

  const handleSave = async () => {
    if (accounts.some(a => !a.name.trim())) {
      alert("Please name all accounts");
      return;
    }

    setSaving(true);
    try {
      if (userId) {
        await updateAccounts(userId, accounts);
        onComplete();
      }
    } catch (err) {
      console.error("Error saving accounts:", err);
      alert("Failed to save accounts");
    } finally {
      setSaving(false);
    }
  };

  if (step === "count") {
    return (
      <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto" style={{ background: "#0F0F0F" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h2 className="text-white text-3xl font-bold mb-2">How many accounts do you have?</h2>
            <p className="text-[#666] text-sm">Bank accounts, cash, credit cards, etc.</p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => accountCount > 1 && setAccountCount(accountCount - 1)}
              className="w-12 h-12 rounded-full font-bold text-xl"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              −
            </button>
            <span className="text-white text-5xl font-bold w-20 text-center">{accountCount}</span>
            <button
              onClick={() => accountCount < 10 && setAccountCount(accountCount + 1)}
              className="w-12 h-12 rounded-full font-bold text-xl"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleStartSetup}
          className="mb-12 w-full py-4 rounded-2xl font-bold"
          style={{ background: "#fff", color: "#000" }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 max-w-md mx-auto pb-12" style={{ background: "#0F0F0F" }}>
      <div className="py-6">
        <h2 className="text-white text-2xl font-bold">Set up your accounts</h2>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {accounts.map((account, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ background: "#1a1a1a" }}>
            <div className="mb-4">
              <label className="text-[#666] text-xs font-semibold block mb-2">Account {i + 1} Name</label>
              <input
                type="text"
                placeholder="e.g., Chase Bank"
                value={account.name}
                onChange={(e) => updateAccount(i, "name", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black text-white placeholder-[#333] outline-none border border-[#333] focus:border-[#666]"
              />
            </div>

            <div>
              <label className="text-[#666] text-xs font-semibold block mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.label}
                    onClick={() => updateAccount(i, "type", type.label)}
                    className="p-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: account.type === type.label ? "#fff" : "rgba(255,255,255,0.05)",
                      color: account.type === type.label ? "#000" : "#666",
                    }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl font-bold"
        style={{ background: "#fff", color: "#000", opacity: saving ? 0.5 : 1 }}
      >
        {saving ? "Saving..." : "Complete Setup"}
      </button>
    </div>
  );
}
