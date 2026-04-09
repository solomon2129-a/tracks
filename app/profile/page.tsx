"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, subscribeToProfile, deleteTransaction, Transaction, Account } from "@/lib/firestore";

type Tab = "overview" | "accounts" | "month";

/* ── date helpers ── */
function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthEnd(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

/* ── stats ── */
function calcStats(txns: Transaction[]) {
  const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

/* ── group transactions by date ── */
function groupByDate(txns: Transaction[]) {
  const map = new Map<string, { label: string; dateObj: Date; items: Transaction[] }>();
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d) continue;
    const key = d.toDateString();
    if (!map.has(key)) {
      map.set(key, {
        label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
        dateObj: d,
        items: [],
      });
    }
    map.get(key)!.items.push(t);
  }
  return Array.from(map.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

/* ── stats card ── */
function StatsCard({ net, income, expenses }: { net: number; income: number; expenses: number }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
      <p className="text-[#666] text-[10px] font-semibold tracking-widest uppercase mb-1">Net</p>
      <p
        className="text-[38px] font-bold leading-none mb-4 tracking-tight"
        style={{ color: net < 0 ? "#F43F5E" : "#FFFFFF" }}
      >
        {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
      </p>
      <div className="flex gap-3">
        <div>
          <p className="text-[#555] text-[10px] uppercase tracking-widest mb-0.5">Income</p>
          <p className="text-[#22C55E] font-bold text-sm tabular-nums">₹{income.toLocaleString("en-IN")}</p>
        </div>
        <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div>
          <p className="text-[#555] text-[10px] uppercase tracking-widest mb-0.5">Spent</p>
          <p className="text-white font-bold text-sm tabular-nums">₹{expenses.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}

/* ── transaction list ── */
function TxnList({ txns, userId }: { txns: Transaction[]; userId: string }) {
  if (txns.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[#444] text-sm">No transactions</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl px-4" style={{ background: "#1A1A1A" }}>
      {txns.map((t, i) => (
        <div key={t.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <TransactionItem transaction={t} onDelete={(id) => deleteTransaction(userId, id)} />
        </div>
      ))}
    </div>
  );
}

/* ── page ── */
export default function ProfilePage() {
  const { userId, loading, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("overview");
  const [historyMonth, setHistoryMonth] = useState(() => new Date());

  useEffect(() => {
    if (!userId) return;
    const unsub1 = subscribeToTransactions(userId, setTransactions);
    const unsub2 = subscribeToProfile(userId, (profile) => {
      setAccounts(profile.accounts);
      if (!selectedAccountId && profile.accounts.length > 0) {
        setSelectedAccountId(profile.accounts[0].id);
      }
    });
    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [userId, selectedAccountId]);

  useEffect(() => {
    if (!loading && !userId) router.push("/");
  }, [loading, userId, router]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountTransactions = selectedAccountId
    ? transactions.filter(t => t.accountId === selectedAccountId)
    : transactions;

  /* filter transactions for month view */
  const s = monthStart(historyMonth);
  const e = monthEnd(historyMonth);
  const monthFiltered = accountTransactions.filter(t => {
    const d = t.createdAt?.toDate?.();
    return d && d >= s && d < e;
  });

  const { income, expenses, net } = calcStats(monthFiltered);
  const defaultStats = calcStats(accountTransactions);

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-xl leading-tight">Profile</p>
          <p className="text-[#555] text-xs mt-1">Track your finances across all accounts</p>
        </div>
        <button
          onClick={logout}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#1A1A1A" }}
          title="Logout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="flex px-5 mb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={() => setTab("overview")}
          className="px-3 py-2.5 text-sm font-semibold transition-colors"
          style={{
            color: tab === "overview" ? "#fff" : "#555",
            borderBottom: `2px solid ${tab === "overview" ? "#fff" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("accounts")}
          className="px-3 py-2.5 text-sm font-semibold transition-colors"
          style={{
            color: tab === "accounts" ? "#fff" : "#555",
            borderBottom: `2px solid ${tab === "accounts" ? "#fff" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Accounts
        </button>
        <button
          onClick={() => setTab("month")}
          className="px-3 py-2.5 text-sm font-semibold transition-colors"
          style={{
            color: tab === "month" ? "#fff" : "#555",
            borderBottom: `2px solid ${tab === "month" ? "#fff" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          Transactions
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 px-5 flex-1">
        {tab === "overview" && (
          <>
            <StatsCard net={defaultStats.net} income={defaultStats.income} expenses={defaultStats.expenses} />

            <div>
              <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase mb-3">Your Accounts</p>
              <div className="flex flex-col gap-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                    style={{
                      background: selectedAccountId === account.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedAccountId === account.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}
                    onClick={() => setSelectedAccountId(account.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">
                          {account.type === "bank" ? "🏦" : account.type === "cash" ? "💵" : account.type === "credit" ? "💳" : "💰"}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-bold">{account.name}</p>
                          <p className="text-[#555] text-xs capitalize">{account.type}</p>
                        </div>
                      </div>
                      <p className="text-white font-bold text-lg">₹{account.balance.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "accounts" && (
          <>
            <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase">Account Summary</p>
            <div className="space-y-3">
              {accounts.map((account) => {
                const accountTxns = transactions.filter(t => t.accountId === account.id);
                const { income: accIncome, expenses: accExpenses, net: accNet } = calcStats(accountTxns);
                return (
                  <div key={account.id} className="p-4 rounded-2xl" style={{ background: "#1A1A1A" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-bold text-lg mb-0.5">{account.name}</p>
                        <p className="text-[#555] text-xs capitalize">{account.type}</p>
                      </div>
                      <p className="text-white font-bold text-lg">₹{account.balance.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div>
                        <p className="text-[#555] text-[10px] uppercase tracking-widest mb-0.5">Income</p>
                        <p className="text-[#22C55E] font-bold">₹{accIncome.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      <div>
                        <p className="text-[#555] text-[10px] uppercase tracking-widest mb-0.5">Spent</p>
                        <p className="text-white font-bold">₹{accExpenses.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                      <div>
                        <p className="text-[#555] text-[10px] uppercase tracking-widest mb-0.5">Net</p>
                        <p style={{ color: accNet < 0 ? "#F43F5E" : "#22C55E" }} className="font-bold">₹{accNet.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "month" && (
          <>
            {/* Month navigator */}
            <div className="flex items-center justify-between py-1">
              <button
                onClick={() => {
                  const d = new Date(historyMonth);
                  d.setMonth(d.getMonth() - 1);
                  setHistoryMonth(d);
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
                style={{ background: "#1A1A1A" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <p className="text-white font-semibold text-base">
                {historyMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>

              <button
                onClick={() => {
                  const d = new Date(historyMonth);
                  d.setMonth(d.getMonth() + 1);
                  if (d <= new Date()) setHistoryMonth(d);
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
                style={{
                  background: "#1A1A1A",
                  opacity: historyMonth.getMonth() === now.getMonth() && historyMonth.getFullYear() === now.getFullYear() ? 0.3 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <StatsCard net={net} income={income} expenses={expenses} />

            {groupByDate(monthFiltered).length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[#444] text-sm">No transactions this month</p>
              </div>
            ) : (
              groupByDate(monthFiltered).map(group => (
                <div key={group.label}>
                  <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase mb-2">
                    {group.label}
                  </p>
                  <div className="rounded-2xl px-4" style={{ background: "#1A1A1A" }}>
                    {group.items.map((t, i) => (
                      <div key={t.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <TransactionItem transaction={t} onDelete={(id) => deleteTransaction(userId, id)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
