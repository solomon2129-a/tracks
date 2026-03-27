"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

type Tab = "today" | "week" | "month" | "history";

/* ── date helpers ── */
function dayStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function weekStart(d = new Date()) {
  const s = dayStart(d);
  s.setDate(s.getDate() - s.getDay()); // Sunday
  return s;
}
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

/* ── bar chart data builders ── */
function dailyBars(txns: Transaction[], start: Date, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const from = new Date(start);
    from.setDate(from.getDate() + i);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const slice = txns.filter(t => {
      const d = t.createdAt?.toDate?.();
      return d && d >= from && d < to;
    });
    const expense = slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const income = slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const names = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return { label: days <= 7 ? names[from.getDay()] : String(from.getDate()), expense, income };
  });
}

function weeklyBars(txns: Transaction[], mStart: Date, mEnd: Date) {
  const weeks: { label: string; expense: number; income: number }[] = [];
  let cur = new Date(mStart);
  let n = 1;
  while (cur < mEnd && n <= 6) {
    const next = new Date(cur);
    next.setDate(next.getDate() + 7);
    const to = next > mEnd ? mEnd : next;
    const slice = txns.filter(t => {
      const d = t.createdAt?.toDate?.();
      return d && d >= cur && d < to;
    });
    const expense = slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const income = slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    weeks.push({ label: `W${n}`, expense, income });
    cur = next;
    n++;
  }
  return weeks;
}

/* ── CSS bar chart ── */
function BarChart({ data }: { data: { label: string; expense: number; income: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.expense, d.income]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
      {data.map((d, i) => {
        const eH = Math.max((d.expense / maxVal) * 68, d.expense > 0 ? 3 : 0);
        const iH = Math.max((d.income / maxVal) * 68, d.income > 0 ? 3 : 0);
        const hasIncome = d.income > 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 68 }}>
              {hasIncome && (
                <div style={{ width: "45%", height: iH, background: "#22C55E", borderRadius: "3px 3px 0 0" }} />
              )}
              <div style={{
                width: hasIncome ? "45%" : "100%",
                height: eH || 2,
                background: eH > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.1)",
                borderRadius: "3px 3px 0 0",
              }} />
            </div>
            <span style={{ color: "#555", fontSize: 9, lineHeight: 1 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<Tab>("month");
  const [historyMonth, setHistoryMonth] = useState(() => new Date());

  useEffect(() => {
    if (!user) return;
    return subscribeToTransactions(user.uid, setTransactions);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const now = new Date();

  /* filter transactions per tab */
  let filtered: Transaction[] = [];
  let chartData: { label: string; expense: number; income: number }[] = [];

  if (tab === "today") {
    const s = dayStart(now);
    const e = new Date(s); e.setDate(e.getDate() + 1);
    filtered = transactions.filter(t => { const d = t.createdAt?.toDate?.(); return d && d >= s && d < e; });
  } else if (tab === "week") {
    const s = weekStart(now);
    const e = new Date(s); e.setDate(e.getDate() + 7);
    filtered = transactions.filter(t => { const d = t.createdAt?.toDate?.(); return d && d >= s && d < e; });
    chartData = dailyBars(transactions, s, 7);
  } else if (tab === "month") {
    const s = monthStart(now);
    const e = monthEnd(now);
    filtered = transactions.filter(t => { const d = t.createdAt?.toDate?.(); return d && d >= s && d < e; });
    chartData = weeklyBars(transactions, s, e);
  } else {
    const s = new Date(historyMonth.getFullYear(), historyMonth.getMonth(), 1);
    const e = new Date(historyMonth.getFullYear(), historyMonth.getMonth() + 1, 1);
    filtered = transactions.filter(t => { const d = t.createdAt?.toDate?.(); return d && d >= s && d < e; });
  }

  const { income, expenses, net } = calcStats(filtered);
  const TABS: { key: Tab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "#1A1A1A" }}
            >
              {user.displayName?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="text-white font-bold text-base leading-tight">{user.displayName?.split(" ")[0] ?? "You"}</p>
            <p className="text-[#555] text-xs leading-tight">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/settings")}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#1A1A1A" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="flex px-5 mb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-3 py-2.5 text-sm font-semibold transition-colors"
            style={{
              color: tab === key ? "#fff" : "#555",
              borderBottom: `2px solid ${tab === key ? "#fff" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 px-5">
        {tab !== "history" ? (
          <>
            <StatsCard net={net} income={income} expenses={expenses} />

            {chartData.length > 0 && (
              <div className="rounded-2xl px-5 pt-4 pb-3" style={{ background: "#1A1A1A" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#666] text-[11px] font-semibold tracking-widest uppercase">
                    {tab === "week" ? "This Week" : "This Month"}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
                      <span className="text-[#555] text-[10px]">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                      <span className="text-[#555] text-[10px]">Spent</span>
                    </div>
                  </div>
                </div>
                <BarChart data={chartData} />
              </div>
            )}

            <div>
              <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase mb-3">
                Transactions {filtered.length > 0 && `· ${filtered.length}`}
              </p>
              <TxnList txns={filtered} userId={user.uid} />
            </div>
          </>
        ) : (
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

            {groupByDate(filtered).length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[#444] text-sm">No transactions this month</p>
              </div>
            ) : (
              groupByDate(filtered).map(group => (
                <div key={group.label}>
                  <p className="text-[#555] text-[11px] font-semibold tracking-widest uppercase mb-2">
                    {group.label}
                  </p>
                  <div className="rounded-2xl px-4" style={{ background: "#1A1A1A" }}>
                    {group.items.map((t, i) => (
                      <div key={t.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <TransactionItem transaction={t} onDelete={(id) => deleteTransaction(user.uid, id)} />
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
