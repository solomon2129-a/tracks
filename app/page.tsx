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
  { key: "all", label: "All time" },
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#191E29" }}>
        <div className="w-8 h-8 border-2 border-[#01C38D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

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
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "#191E29" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[#7A8EA0] text-sm">{greeting()}</p>
          <p className="text-white text-xl font-bold mt-0.5">
            {user.displayName?.split(" ")[0] ?? "there"} 👋
          </p>
        </div>
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
            style={{ boxShadow: "0 0 0 2px rgba(1,195,141,0.4)" }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "#132046", boxShadow: "0 0 0 2px rgba(1,195,141,0.4)" }}
          >
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
        <div className="flex gap-2">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap"
              style={{
                background: period === key ? "#01C38D" : "rgba(255,255,255,0.06)",
                color: period === key ? "#fff" : "#7A8EA0",
                boxShadow: period === key ? "0 2px 12px rgba(1,195,141,0.35)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="px-5 mb-4">
          <BreakdownList categoryTotals={categoryTotals} totalExpenses={periodExpenses} />
        </div>
      )}

      {/* Transactions */}
      <div className="px-5">
        <div className="rounded-3xl px-5 py-5" style={{ background: "#132046" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase">Transactions</p>
            {filtered.length > 0 && (
              <span
                className="text-[#7A8EA0] text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {filtered.length}
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(1,195,141,0.1)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#01C38D" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <p className="text-white text-sm font-semibold">No transactions</p>
              <p className="text-[#7A8EA0] text-xs mt-1">Tap + to log your first one</p>
            </div>
          ) : (
            <div style={{ borderTop: "0px" }}>
              {filtered.map((t, i) => (
                <div
                  key={t.id}
                  style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <TransactionItem
                    transaction={t}
                    onDelete={(id) => deleteTransaction(user.uid, id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddModal userId={user.uid} onClose={() => setShowAdd(false)} />}
      <BottomNav onAddClick={() => setShowAdd(true)} />
    </div>
  );
}
