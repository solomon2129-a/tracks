"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import AddModal from "@/components/AddModal";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";
import TransactionItem from "@/components/TransactionItem";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeToTransactions(user.uid, setTransactions);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#191E29] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#01C38D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-[#191E29] flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">Profile</h1>
        <button
          onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-full bg-[#132046] flex items-center justify-center text-[#606E79] active:scale-95 transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* User card */}
        <div className="bg-[#132046] rounded-3xl p-5 flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#191E29] flex items-center justify-center text-white font-bold text-xl">
              {user.displayName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg">{user.displayName}</p>
            <p className="text-[#606E79] text-sm">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#132046] rounded-3xl p-6">
          <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase mb-2">Net Balance</p>
          <p className={`text-[38px] font-bold leading-none mb-5 ${net < 0 ? "text-[#FF5A5F]" : "text-white"}`}>
            {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
          </p>
          <div className="flex gap-6">
            <div>
              <p className="text-[#606E79] text-xs mb-1">Income</p>
              <p className="text-[#01C38D] font-semibold tabular-nums">₹{totalIncome.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px bg-[#2A3441]" />
            <div>
              <p className="text-[#606E79] text-xs mb-1">Spent</p>
              <p className="text-white font-semibold tabular-nums">₹{totalExpenses.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px bg-[#2A3441]" />
            <div>
              <p className="text-[#606E79] text-xs mb-1">Entries</p>
              <p className="text-white font-semibold">{transactions.length}</p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-[#132046] rounded-3xl px-5 py-5">
          <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase mb-4">All Transactions</p>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#606E79] text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2A3441]">
              {transactions.map((t) => (
                <TransactionItem key={t.id} transaction={t} onDelete={(id) => deleteTransaction(user.uid, id)} />
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
