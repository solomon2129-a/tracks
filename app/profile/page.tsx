"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, deleteTransaction, Transaction, ALL_CATEGORY_EMOJI } from "@/lib/firestore";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const expenseCategoryTotals = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  const handleDelete = async (id: string) => {
    await deleteTransaction(user.uid, id);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0C0C10] flex flex-col pb-28">
      {/* Header */}
      <div className="pt-16 pb-5 px-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-[#3A3A4A] font-medium active:text-white transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A24] flex items-center justify-center text-white font-bold text-lg">
              {user.displayName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="font-bold text-white">{user.displayName}</p>
            <p className="text-[#3A3A4A] text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* Balance card */}
        <div className="bg-indigo-600 rounded-3xl p-6 fade-up shadow-2xl shadow-indigo-900/40">
          <p className="text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-3">Net Balance</p>
          <p className={`text-5xl font-bold tracking-tight mb-6 ${netBalance < 0 ? "text-red-300" : "text-white"}`}>
            {netBalance < 0 ? "−" : "+"}₹{Math.abs(netBalance).toLocaleString("en-IN")}
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-black/20 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-indigo-300 text-xs font-medium">Income</p>
              </div>
              <p className="text-white font-bold text-xl tabular-nums">₹{totalIncome.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-black/20 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-indigo-300 text-xs font-medium">Spent</p>
              </div>
              <p className="text-white font-bold text-xl tabular-nums">₹{totalExpenses.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(expenseCategoryTotals).length > 0 && (
          <div className="bg-[#131318] rounded-3xl p-5 border border-[#1F1F2A] fade-up">
            <p className="text-[#3A3A4A] text-xs font-semibold tracking-widest uppercase mb-4">Spending by category</p>
            <div className="flex flex-col gap-4">
              {Object.entries(expenseCategoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => {
                  const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ALL_CATEGORY_EMOJI[cat] ?? "📦"}</span>
                          <span className="text-sm font-semibold text-white">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#3A3A4A]">{pct.toFixed(0)}%</span>
                          <span className="text-sm font-bold text-white tabular-nums">₹{total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#1F1F2A] rounded-full overflow-hidden">
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
        <div className="bg-[#131318] rounded-3xl p-5 border border-[#1F1F2A] fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#3A3A4A] text-xs font-semibold tracking-widest uppercase">History</p>
            {transactions.length > 0 && (
              <span className="text-xs text-[#3A3A4A] bg-[#1A1A24] px-2 py-0.5 rounded-full">
                {transactions.length}
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-[#3A3A4A] text-sm">No transactions yet</p>
              <p className="text-[#2A2A38] text-xs mt-1">Add your first one above</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A24]">
              {transactions.map((t) => (
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
