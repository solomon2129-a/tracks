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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#191E29" }}>
        <div className="w-8 h-8 border-2 border-[#01C38D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: "#191E29" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">Profile</h1>
        <button
          onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "rgba(255,255,255,0.06)", color: "#7A8EA0" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* User card */}
        <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: "#132046" }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-14 h-14 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 2.5px rgba(1,195,141,0.35)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ background: "#191E29" }}
            >
              {user.displayName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg">{user.displayName}</p>
            <p className="text-[#7A8EA0] text-sm">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #132046 60%, #1A2A52 100%)" }}
        >
          <div
            className="absolute w-40 h-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: net >= 0 ? "rgba(1,195,141,0.15)" : "rgba(255,90,95,0.15)", top: "-20%", right: "-10%" }}
          />
          <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase mb-2">Net Balance</p>
          <p
            className="text-[38px] font-bold leading-none mb-5"
            style={{ color: net < 0 ? "#FF5A5F" : "#fff" }}
          >
            {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
          </p>
          <div className="flex gap-4">
            <div className="flex-1 rounded-2xl px-3 py-2.5" style={{ background: "rgba(1,195,141,0.12)" }}>
              <p className="text-[#01C38D] text-[10px] font-bold tracking-widest uppercase mb-0.5">Income</p>
              <p className="text-white font-bold tabular-nums text-sm">₹{totalIncome.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,90,95,0.1)" }}>
              <p className="text-[#FF5A5F] text-[10px] font-bold tracking-widest uppercase mb-0.5">Spent</p>
              <p className="text-white font-bold tabular-nums text-sm">₹{totalExpenses.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 rounded-2xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <p className="text-[#7A8EA0] text-[10px] font-bold tracking-widest uppercase mb-0.5">Entries</p>
              <p className="text-white font-bold text-sm">{transactions.length}</p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-3xl px-5 py-5" style={{ background: "#132046" }}>
          <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase mb-4">All Transactions</p>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#7A8EA0] text-sm">No transactions yet</p>
            </div>
          ) : (
            <div>
              {transactions.map((t, i) => (
                <div
                  key={t.id}
                  style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <TransactionItem transaction={t} onDelete={(id) => deleteTransaction(user.uid, id)} />
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
