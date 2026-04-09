"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

type Tab = "today" | "week" | "month" | "history";

/* ─── date helpers ─── */
function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d = new Date()) {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay()); // Sunday
  return s;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function filterByRange(txns: Transaction[], from: Date, to: Date) {
  return txns.filter(t => {
    const d = t.createdAt?.toDate?.();
    return d && d >= from && d < to;
  });
}

/* ─── stats ─── */
function calcStats(txns: Transaction[]) {
  const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

/* ─── group by date ─── */
function groupByDate(txns: Transaction[]) {
  const map = new Map<string, { label: string; dateObj: Date; items: Transaction[] }>();
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d) continue;
    const key = d.toDateString();
    if (!map.has(key)) {
      map.set(key, {
        label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
        dateObj: d,
        items: [],
      });
    }
    map.get(key)!.items.push(t);
  }
  return Array.from(map.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

/* ─── CSS bar chart ─── */
function BarChart({ data }: { data: { label: string; expense: number; income: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.expense, d.income]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 72 }}>
      {data.map((d, i) => {
        const eH = Math.max((d.expense / maxVal) * 56, d.expense > 0 ? 4 : 0);
        const iH = Math.max((d.income / maxVal) * 56, d.income > 0 ? 4 : 0);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 56 }}>
              {iH > 0 && (
                <div style={{ width: "45%", height: iH, background: "#22C55E", borderRadius: "3px 3px 0 0" }} />
              )}
              <div style={{
                width: iH > 0 ? "45%" : "100%",
                height: eH || 2,
                background: eH > 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.08)",
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

/* ─── Stats row ─── */
function StatsRow({ income, expenses, net }: { income: number; expenses: number; net: number }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
      <p className="text-[#666] text-[9px] font-semibold tracking-widest uppercase mb-1">Net Balance</p>
      <p
        className="font-bold leading-none mb-4 tracking-tight"
        style={{ fontSize: 40, color: net < 0 ? "#F43F5E" : "#FFFFFF" }}
      >
        {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
      </p>
      <div className="flex gap-5">
        <div>
          <p className="text-[#555] text-[9px] uppercase tracking-widest mb-0.5">Income</p>
          <p className="text-[#22C55E] font-bold text-sm tabular-nums">+₹{income.toLocaleString("en-IN")}</p>
        </div>
        <div className="w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div>
          <p className="text-[#555] text-[9px] uppercase tracking-widest mb-0.5">Spent</p>
          <p className="text-white font-bold text-sm tabular-nums">−₹{expenses.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Transaction list ─── */
function TxnList({ txns, userId }: { txns: Transaction[]; userId: string }) {
  if (txns.length === 0) {
    return <p className="text-center text-[#444] text-sm py-10">No transactions</p>;
  }
  const groups = groupByDate(txns);
  return (
    <div className="flex flex-col gap-3">
      {groups.map(group => (
        <div key={group.label}>
          <p className="text-[#444] text-[10px] font-semibold tracking-widest uppercase mb-2">{group.label}</p>
          <div className="rounded-2xl px-4" style={{ background: "#1A1A1A" }}>
            {group.items.map((t, i) => (
              <div key={t.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <TransactionItem transaction={t} onDelete={(id) => deleteTransaction(userId, id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function ProfilePage() {
  const { userId, loading, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<Tab>("today");
  const [historyMonth, setHistoryMonth] = useState(() => new Date());

  useEffect(() => {
    if (!userId) return;
    return subscribeToTransactions(userId, setTransactions);
  }, [userId]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const now = new Date();

  /* ── Filtered data per tab ── */
  let filtered: Transaction[] = [];
  let chartData: { label: string; expense: number; income: number }[] = [];

  if (tab === "today") {
    const from = startOfDay(now);
    const to = new Date(from); to.setDate(to.getDate() + 1);
    filtered = filterByRange(transactions, from, to);

    // 8 3-hour buckets: 12am 3am 6am 9am 12pm 3pm 6pm 9pm
    chartData = Array.from({ length: 8 }, (_, i) => {
      const from = startOfDay(now);
      from.setHours(i * 3);
      const to = new Date(from);
      to.setHours(to.getHours() + 3);
      const slice = filterByRange(transactions, from, to);
      const labels = ["12a","3a","6a","9a","12p","3p","6p","9p"];
      return {
        label: labels[i],
        expense: slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        income: slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      };
    });

  } else if (tab === "week") {
    const from = startOfWeek(now);
    const to = new Date(from); to.setDate(to.getDate() + 7);
    filtered = filterByRange(transactions, from, to);

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    chartData = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(from);
      day.setDate(day.getDate() + i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const slice = filterByRange(transactions, day, next);
      return {
        label: days[i],
        expense: slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        income: slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      };
    });

  } else if (tab === "month") {
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    filtered = filterByRange(transactions, from, to);

    // 4 weekly buckets
    const daysInMonth = to.getDate() - 1; // days in this month
    chartData = Array.from({ length: 4 }, (_, i) => {
      const wFrom = new Date(from);
      wFrom.setDate(wFrom.getDate() + i * 7);
      const wTo = new Date(wFrom);
      wTo.setDate(wTo.getDate() + 7);
      const slice = filterByRange(transactions, wFrom, wTo > to ? to : wTo);
      return {
        label: `W${i + 1}`,
        expense: slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        income: slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      };
    });

  } else {
    // history: selected month
    const from = new Date(historyMonth.getFullYear(), historyMonth.getMonth(), 1);
    const to = new Date(historyMonth.getFullYear(), historyMonth.getMonth() + 1, 1);
    filtered = filterByRange(transactions, from, to);
  }

  const { income, expenses, net } = calcStats(filtered);

  const TABS: { key: Tab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-2xl tracking-tight">Spending</p>
          <p className="text-[#555] text-sm mt-0.5">Track where your money goes</p>
        </div>
        <button
          onClick={logout}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#1A1A1A" }}
          title="Lock app"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex px-5 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors"
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
      <div className="flex flex-col gap-3 px-5 flex-1">

        {tab === "history" ? (
          <>
            {/* Month navigator */}
            <div className="flex items-center justify-between py-1">
              <button
                onClick={() => { const d = new Date(historyMonth); d.setMonth(d.getMonth() - 1); setHistoryMonth(d); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90"
                style={{ background: "#1A1A1A" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <p className="text-white font-semibold">
                {historyMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
              <button
                onClick={() => {
                  const d = new Date(historyMonth);
                  d.setMonth(d.getMonth() + 1);
                  if (d <= now) setHistoryMonth(d);
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
            <StatsRow income={income} expenses={expenses} net={net} />
            <TxnList txns={filtered} userId={userId} />
          </>
        ) : (
          <>
            <StatsRow income={income} expenses={expenses} net={net} />

            {/* Chart */}
            {chartData.some(d => d.expense > 0 || d.income > 0) && (
              <div className="rounded-2xl px-5 pt-4 pb-3" style={{ background: "#1A1A1A" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#666] text-[10px] font-semibold tracking-widest uppercase">
                    {tab === "today" ? "By Hour" : tab === "week" ? "By Day" : "By Week"}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} />
                      <span className="text-[#555] text-[9px]">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white opacity-70" />
                      <span className="text-[#555] text-[9px]">Spent</span>
                    </div>
                  </div>
                </div>
                <BarChart data={chartData} />
              </div>
            )}

            {/* Transactions label */}
            <div className="flex items-center justify-between mt-1">
              <p className="text-[#444] text-[10px] font-semibold tracking-widest uppercase">
                Transactions {filtered.length > 0 && `· ${filtered.length}`}
              </p>
            </div>
            <TxnList txns={filtered} userId={userId} />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
