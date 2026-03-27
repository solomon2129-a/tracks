"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import CategoryIcon from "@/components/CategoryIcon";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

type Period = "today" | "week" | "month" | "all";

function startOf(period: Period): Date {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(0);
}

function filterByPeriod(txns: Transaction[], period: Period): Transaction[] {
  if (period === "all") return txns;
  const start = startOf(period);
  return txns.filter((t) => {
    const d = t.createdAt?.toDate?.();
    return d && d >= start;
  });
}

function daysInPeriod(period: Period): number {
  const now = new Date();
  if (period === "today") return 1;
  if (period === "week") return 7;
  if (period === "month") return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return 1;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    if (!user) return;
    return subscribeToTransactions(user.uid, setTransactions);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = filterByPeriod(transactions, period);
  const allIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance = allIncome - allExpenses;

  const periodIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const periodExpenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const days = daysInPeriod(period);
  const dailyAvg = period !== "today" ? periodExpenses / days : periodExpenses;

  const expenseCategoryTotals = filtered
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  const handleDelete = async (id: string) => {
    await deleteTransaction(user.uid, id);
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-[#0C0C10] flex flex-col pb-28">
      {/* Header */}
      <div className="pt-16 pb-5 px-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-2xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#1A1A24] flex items-center justify-center text-white font-bold">
                {user.displayName?.[0] ?? "?"}
              </div>
            )}
            <div>
              <p className="font-bold text-white text-sm">{user.displayName}</p>
              <p className="text-[#3A3A4A] text-xs">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="w-10 h-10 rounded-2xl bg-[#131318] border border-[#1F1F2A] flex items-center justify-center text-[#4A4A5A] active:scale-95 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Overall balance */}
        <div className="bg-indigo-600 rounded-3xl p-5 shadow-2xl shadow-indigo-900/40">
          <p className="text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-2">Total Balance</p>
          <p className={`text-4xl font-bold tracking-tight mb-4 ${netBalance < 0 ? "text-red-300" : "text-white"}`}>
            {netBalance < 0 ? "−" : "+"}₹{Math.abs(netBalance).toLocaleString("en-IN")}
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/20 rounded-2xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-indigo-300 text-xs">Income</p>
              </div>
              <p className="text-white font-bold text-lg tabular-nums">₹{allIncome.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-black/20 rounded-2xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <p className="text-indigo-300 text-xs">Spent</p>
              </div>
              <p className="text-white font-bold text-lg tabular-nums">₹{allExpenses.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* Period selector */}
        <div className="bg-[#131318] rounded-2xl p-1 flex border border-[#1F1F2A]">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                period === key
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-[#3A3A4A]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Period stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#131318] rounded-3xl p-4 border border-[#1F1F2A]">
            <p className="text-[#3A3A4A] text-xs mb-1">Spent</p>
            <p className="text-red-400 font-bold text-xl tabular-nums">₹{periodExpenses.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-[#131318] rounded-3xl p-4 border border-[#1F1F2A]">
            <p className="text-[#3A3A4A] text-xs mb-1">Received</p>
            <p className="text-emerald-400 font-bold text-xl tabular-nums">₹{periodIncome.toLocaleString("en-IN")}</p>
          </div>
          {period !== "today" && period !== "all" && (
            <>
              <div className="bg-[#131318] rounded-3xl p-4 border border-[#1F1F2A]">
                <p className="text-[#3A3A4A] text-xs mb-1">Daily avg spend</p>
                <p className="text-white font-bold text-xl tabular-nums">₹{dailyAvg.toFixed(0)}</p>
              </div>
              <div className="bg-[#131318] rounded-3xl p-4 border border-[#1F1F2A]">
                <p className="text-[#3A3A4A] text-xs mb-1">Net {period}</p>
                <p className={`font-bold text-xl tabular-nums ${periodIncome - periodExpenses >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {periodIncome - periodExpenses >= 0 ? "+" : "−"}₹{Math.abs(periodIncome - periodExpenses).toLocaleString("en-IN")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Category breakdown */}
        {Object.keys(expenseCategoryTotals).length > 0 && (
          <div className="bg-[#131318] rounded-3xl p-5 border border-[#1F1F2A]">
            <p className="text-[#3A3A4A] text-xs font-semibold tracking-widest uppercase mb-4">Spending breakdown</p>
            <div className="flex flex-col gap-4">
              {Object.entries(expenseCategoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => {
                  const pct = periodExpenses > 0 ? (total / periodExpenses) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <CategoryIcon category={cat} size={15} color="#EF4444" strokeWidth={1.8} />
                          </div>
                          <span className="text-sm font-semibold text-white">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#3A3A4A]">{pct.toFixed(0)}%</span>
                          <span className="text-sm font-bold text-white tabular-nums">₹{total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="h-1 bg-[#1F1F2A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* History */}
        <div className="bg-[#131318] rounded-3xl p-5 border border-[#1F1F2A]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#3A3A4A] text-xs font-semibold tracking-widest uppercase">History</p>
            {filtered.length > 0 && (
              <span className="text-xs text-[#3A3A4A] bg-[#1A1A24] px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#3A3A4A] text-sm">No transactions for this period</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A24]">
              {filtered.map((t) => (
                <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
