"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginScreen from "@/components/LoginScreen";
import BalanceCard from "@/components/BalanceCard";
import BreakdownList from "@/components/BreakdownList";
import TransactionItem from "@/components/TransactionItem";
import BottomNav from "@/components/BottomNav";
import AddModal from "@/components/AddModal";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

type Period = "today" | "week" | "month" | "all";

function startOf(period: Period): Date {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeToTransactions(user.uid, setTransactions);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191E29] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#01C38D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  // All-time totals for hero card
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Period-filtered data
  const start = startOf(period);
  const filtered = period === "all" ? transactions : transactions.filter((t) => {
    const d = t.createdAt?.toDate?.();
    return d && d >= start;
  });

  const periodExpenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const categoryTotals = filtered
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-[#191E29] flex flex-col pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between">
        <div>
          <p className="text-[#606E79] text-sm">{greeting()}</p>
          <p className="text-white text-xl font-bold mt-0.5">
            {user.displayName?.split(" ")[0] ?? "there"}
          </p>
        </div>
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-[#2A3441]" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#132046] flex items-center justify-center text-white font-bold text-sm ring-2 ring-[#2A3441]">
            {user.displayName?.[0] ?? "?"}
          </div>
        )}
      </div>

      {/* Balance Card */}
      <div className="px-5 mb-5">
        <BalanceCard income={totalIncome} expenses={totalExpenses} />
      </div>

      {/* Period Tabs */}
      <div className="px-5 mb-4">
        <div className="bg-[#132046] rounded-2xl p-1 flex">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                period === key ? "bg-[#01C38D] text-[#191E29]" : "text-[#606E79]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Spending Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="px-5 mb-4">
          <BreakdownList categoryTotals={categoryTotals} totalExpenses={periodExpenses} />
        </div>
      )}

      {/* Transaction History */}
      <div className="px-5">
        <div className="bg-[#132046] rounded-3xl px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase">Transactions</p>
            {filtered.length > 0 && (
              <span className="text-[#606E79] text-xs bg-[#191E29] px-2 py-0.5 rounded-full">{filtered.length}</span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#606E79] text-sm">No transactions</p>
              <p className="text-[#2A3441] text-xs mt-1">Tap + to add one</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2A3441]">
              {filtered.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onDelete={(id) => deleteTransaction(user.uid, id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && <AddModal userId={user.uid} onClose={() => setShowAdd(false)} />}

      <BottomNav onAddClick={() => setShowAdd(true)} />
    </div>
  );
}
