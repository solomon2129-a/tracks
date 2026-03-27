"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍔",
  Travel: "✈️",
  Bills: "📄",
  Lifestyle: "✨",
  Other: "📦",
};

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTransactions(user.uid, setTransactions);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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

  const categoryTotals = transactions
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
    <div className="min-h-screen flex flex-col pb-20">
      {/* Header */}
      <div className="pt-14 pb-6 px-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 font-medium"
          >
            Sign out
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User"}
              className="w-14 h-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {user.displayName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-lg">{user.displayName}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {/* Financial Summary */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white">
          <p className="text-indigo-200 text-xs font-medium tracking-widest uppercase mb-4">Net Balance</p>
          <p className={`text-4xl font-bold mb-6 ${netBalance < 0 ? "text-red-300" : "text-white"}`}>
            {netBalance < 0 ? "-" : "+"}₹{Math.abs(netBalance).toLocaleString("en-IN")}
          </p>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <p className="text-indigo-200 text-xs mb-1">Income</p>
              <p className="text-white font-bold text-lg">₹{totalIncome.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <p className="text-indigo-200 text-xs mb-1">Spent</p>
              <p className="text-white font-bold text-lg">₹{totalExpenses.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm">
            <p className="text-gray-400 text-xs font-medium tracking-widest uppercase mb-4">By Category</p>
            <div className="flex flex-col gap-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => {
                  const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                          <span className="text-sm font-medium text-gray-700">{cat}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm">
          <p className="text-gray-400 text-xs font-medium tracking-widest uppercase mb-4">
            History ({transactions.length})
          </p>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 text-4xl mb-2">₹</p>
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
