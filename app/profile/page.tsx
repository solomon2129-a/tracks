"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

/* ─── Local goal type ─── */
interface LocalGoal {
  id: string; name: string; targetAmount: number;
  currentAmount: number; targetDateMs: number; createdAtMs: number;
}
function loadGoals(uid: string): LocalGoal[] {
  try { const r = localStorage.getItem(`tracksy_goals_${uid}`); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

/* ─── Types ─── */
type CalView = "month" | "week" | "day";
type Dir = "forward" | "back";

/* ─── Date utils ─── */
const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const eod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function sundayOfWeek(d: Date): Date {
  const s = sod(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function filterRange(txns: Transaction[], from: Date, to: Date): Transaction[] {
  return txns.filter(t => {
    const d = t.createdAt?.toDate?.();
    return d && d >= from && d < to;
  });
}

/* ─── Calendar grid builder ─── */
// Returns array of weeks. Each week = 7 Date objects (Sun…Sat).
// Days outside the current month are still valid dates (needed for week continuity).
function buildMonthGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startSunday = sundayOfWeek(firstOfMonth);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = firstOfMonth.getDay() + daysInMonth;
  const totalWeeks = Math.ceil(totalCells / 7);
  return Array.from({ length: totalWeeks }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => addDays(startSunday, wi * 7 + di))
  );
}

/* ─── Day totals map ─── */
type DayTotals = { expense: number; income: number };

function buildDayMap(txns: Transaction[]): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>();
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const curr = map.get(key) ?? { expense: 0, income: 0 };
    if (t.type === "expense") curr.expense += t.amount;
    else curr.income += t.amount;
    map.set(key, curr);
  }
  return map;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/* ─── Color logic ─── */
// No activity → very muted grey
// Income > Expense → soft green
// Expense ≥ Income (with activity) → red (intensity by ratio)
function dayBg(t: DayTotals | undefined): string {
  if (!t || (t.expense === 0 && t.income === 0)) return "rgba(255,255,255,0.05)";
  if (t.income > t.expense) {
    const intensity = Math.min((t.income - t.expense) / Math.max(t.income, 1), 1);
    return intensity > 0.5 ? "rgba(34,197,94,0.28)" : "rgba(34,197,94,0.16)";
  }
  const ratio = Math.min(t.expense / Math.max(t.expense + t.income, 1), 1);
  if (ratio < 0.6)  return "rgba(244,63,94,0.18)";
  if (ratio < 0.8)  return "rgba(244,63,94,0.32)";
  return "rgba(244,63,94,0.50)";
}

function dayTextColor(t: DayTotals | undefined, isToday: boolean): string {
  if (isToday) return "#fff";
  if (!t || (t.expense === 0 && t.income === 0)) return "#3A3A3A";
  return "rgba(255,255,255,0.85)";
}

/* ─── Stats ─── */
function calcStats(txns: Transaction[]) {
  const income   = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const saved    = txns.filter(t => t.type === "expense" && t.category === "Savings").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === "expense" && t.category !== "Savings").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, saved, net: income - expenses - saved };
}

/* ─── Group by date ─── */
function groupByDate(txns: Transaction[]) {
  const map = new Map<string, { label: string; dateObj: Date; items: Transaction[] }>();
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d) continue;
    const key = d.toDateString();
    if (!map.has(key)) map.set(key, {
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      dateObj: d, items: [],
    });
    map.get(key)!.items.push(t);
  }
  return Array.from(map.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
const DOW_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
const DOW_LABEL  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ─── Stats Row ─── */
function StatsRow({ income, expenses, saved, net }: { income: number; expenses: number; saved: number; net: number }) {
  return (
    <div className="rounded-2xl px-5 py-4 fade-up" style={{ background: "#1A1A1A" }}>
      <p className="text-[#444] text-[9px] font-semibold tracking-widest uppercase mb-1">Net Balance</p>
      <p className="font-bold leading-none mb-4 tracking-tight"
        style={{ fontSize: 34, color: net < 0 ? "#F43F5E" : net > 0 ? "#fff" : "#555" }}>
        {net < 0 ? "−" : net > 0 ? "+" : ""}{fmt(net)}
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-[#444] text-[9px] uppercase tracking-widest mb-0.5">Income</p>
          <p className="text-[#22C55E] font-bold text-sm tabular-nums">+{fmt(income)}</p>
        </div>
        <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="flex-1">
          <p className="text-[#444] text-[9px] uppercase tracking-widest mb-0.5">Spent</p>
          <p className="text-white font-bold text-sm tabular-nums">−{fmt(expenses)}</p>
        </div>
        {saved > 0 && <>
          <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex-1">
            <p className="text-[#444] text-[9px] uppercase tracking-widest mb-0.5">Saved</p>
            <p className="font-bold text-sm tabular-nums" style={{ color: "#22C55E" }}>−{fmt(saved)}</p>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ─── Transaction list ─── */
function TxnList({ txns, userId }: { txns: Transaction[]; userId: string }) {
  if (txns.length === 0)
    return <p className="text-center text-[#333] text-sm py-8">No transactions this day</p>;
  return (
    <div className="flex flex-col gap-3">
      {groupByDate(txns).map(group => (
        <div key={group.label}>
          <p className="text-[#333] text-[10px] font-semibold tracking-widest uppercase mb-2">{group.label}</p>
          <div className="rounded-2xl px-4" style={{ background: "#1A1A1A" }}>
            {group.items.map((t, i) => (
              <div key={t.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <TransactionItem transaction={t} onDelete={id => deleteTransaction(userId, id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Goals strip ─── */
function GoalsStrip({ goals }: { goals: LocalGoal[] }) {
  const active = goals.filter(g => g.currentAmount < g.targetAmount);
  if (active.length === 0) return null;
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const pct = Math.min(100, (totalSaved / Math.max(totalTarget, 1)) * 100);
  return (
    <div className="rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#444] text-[9px] font-semibold tracking-widest uppercase">Goals Progress</p>
        <p className="text-[#444] text-[9px]">{active.length} active</p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#22C55E" }} />
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-white font-bold text-sm">₹{totalSaved.toLocaleString("en-IN")} saved</p>
        <p className="text-[#444] text-xs">of ₹{totalTarget.toLocaleString("en-IN")}</p>
      </div>
      <div className="flex flex-col gap-2">
        {active.slice(0, 3).map(g => {
          const gPct = Math.min(100, (g.currentAmount / Math.max(g.targetAmount, 1)) * 100);
          const dLeft = Math.max(0, Math.round((g.targetDateMs - Date.now()) / 86400000));
          return (
            <div key={g.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <p className="text-white text-xs font-semibold truncate">{g.name}</p>
                  <p className="text-[#444] text-[9px] ml-2 flex-shrink-0">{dLeft}d left</p>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${gPct}%`, background: "#22C55E" }} />
                </div>
              </div>
              <p className="text-[#555] text-[10px] font-semibold tabular-nums">{Math.round(gPct)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Profile Drawer ─── */
function ProfileDrawer({ open, onClose, user, onChangePin, onForgotPin, onSignOut, onReset }: {
  open: boolean; onClose: () => void;
  user: { email?: string | null; metadata?: { creationTime?: string } } | null;
  onChangePin: () => void; onForgotPin: () => void; onSignOut: () => void; onReset: () => void;
}) {
  const [resetConfirm, setResetConfirm] = useState(false);
  if (!open) return null;
  const email = user?.email || "";
  const initial = email.charAt(0).toUpperCase() || "?";
  const memberSince = (() => {
    try { const t = user?.metadata?.creationTime; return t ? new Date(t).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"; }
    catch { return "—"; }
  })();
  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 4000); return; }
    onReset();
  };
  const Row = ({ icon, label, color = "#fff", onClick }: { icon: React.ReactNode; label: string; color?: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 py-4 active:opacity-60 transition-opacity text-left"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>{icon}</div>
      <span className="font-semibold text-sm flex-1" style={{ color }}>{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  );
  return (
    <>
      <div className="fixed inset-0 z-50 fade-in" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto sheet-up rounded-t-3xl"
        style={{ background: "#141414", paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex justify-center pt-3 pb-5"><div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} /></div>
        <div className="px-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#2A2A2A" }}>
              <span className="text-white font-bold text-2xl">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-base truncate">{email}</p>
              <p className="text-[#444] text-xs mt-0.5">Member since {memberSince}</p>
            </div>
          </div>
          <Row onClick={onChangePin} label="Change PIN" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
          <Row onClick={onForgotPin} label="Forgot PIN" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
          <Row onClick={onSignOut} label="Sign Out" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} />
          <Row onClick={handleReset} label={resetConfirm ? "Tap again to confirm" : "Reset Account"} color="#F43F5E"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>} />
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────
   Page
──────────────────────────────────────── */
const CHEVRON_LEFT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const CHEVRON_RIGHT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function ProfilePage() {
  const { userId, loading, user, logout, forgotPassword, resetAccount } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals]               = useState<LocalGoal[]>([]);
  const [calView, setCalView]           = useState<CalView>("month");
  const [animDir, setAnimDir]           = useState<Dir>("forward");
  const [animKey, setAnimKey]           = useState(0);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  // Month being browsed
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Week start (Sunday) being viewed
  const [weekStart, setWeekStart] = useState(() => sundayOfWeek(new Date()));
  // Selected day
  const [selDay, setSelDay] = useState<Date>(() => sod(new Date()));

  useEffect(() => {
    if (!userId) return;
    setGoals(loadGoals(userId));
    return subscribeToTransactions(userId, setTransactions);
  }, [userId]);

  /* ── Navigation helpers ── */
  function go(view: CalView, dir: Dir) {
    setAnimDir(dir);
    setAnimKey(k => k + 1);
    setCalView(view);
  }

  function openWeek(ws: Date) { setWeekStart(ws); go("week", "forward"); }
  function openDay(d: Date)   { setSelDay(sod(d)); go("day", "forward"); }
  function goBack()           { calView === "day" ? go("week", "back") : go("month", "back"); }

  /* ── Week navigation ── */
  function prevWeek() { setWeekStart(w => addDays(w, -7)); setAnimKey(k => k + 1); setAnimDir("back"); }
  function nextWeek() {
    const nw = addDays(weekStart, 7);
    if (nw <= new Date()) { setWeekStart(nw); setAnimKey(k => k + 1); setAnimDir("forward"); }
  }
  const isCurrentOrFutureWeek = addDays(weekStart, 7) > new Date();

  /* ── Month navigation ── */
  function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() {
    const n = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    if (n <= new Date()) setViewDate(n);
  }

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const now       = new Date();
  const viewYear  = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const isThisMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  /* ── Build data ── */
  const dayMap      = buildDayMap(transactions);
  const calGrid     = buildMonthGrid(viewYear, viewMonth);
  const monthTxns   = filterRange(transactions, new Date(viewYear, viewMonth, 1), new Date(viewYear, viewMonth + 1, 1));
  const weekEnd     = addDays(weekStart, 7);
  const weekTxns    = filterRange(transactions, weekStart, weekEnd);
  const dayTxns     = filterRange(transactions, selDay, eod(selDay));

  const viewStats = calView === "day" ? calcStats(dayTxns)
    : calView === "week" ? calcStats(weekTxns)
    : calcStats(monthTxns);

  const weekLabel = `${weekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
  const dayLabel  = selDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  const animClass = animDir === "forward" ? "cal-slide-forward" : "cal-slide-back";

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-2xl tracking-tight">Spending</p>
          <p className="text-[#444] text-sm mt-0.5">Track where your money goes</p>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#1A1A1A" }}>
          <span className="text-white font-bold text-base leading-none">
            {(user?.email?.charAt(0) || "?").toUpperCase()}
          </span>
        </button>
      </div>

      {/* ── Nav bar (back / title / week arrows) ── */}
      <div className="px-5 flex items-center justify-between h-10 mb-1">

        {/* Left: back button or month arrows */}
        {calView === "month" ? (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#1A1A1A", color: "#fff" }}>
              {CHEVRON_LEFT}
            </button>
            <p className="text-white font-semibold text-sm w-32 text-center">
              {viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#1A1A1A", color: "#fff", opacity: isThisMonth ? 0.25 : 1 }}>
              {CHEVRON_RIGHT}
            </button>
          </div>
        ) : (
          <button onClick={goBack}
            className="flex items-center gap-1.5 px-3 h-8 rounded-xl active:scale-95 transition-transform"
            style={{ background: "#1A1A1A", color: "#888" }}>
            {CHEVRON_LEFT}
            <span className="text-sm font-semibold">{calView === "day" ? "Week" : "Month"}</span>
          </button>
        )}

        {/* Center / right: title or week nav */}
        {calView === "week" && (
          <div className="flex items-center gap-2">
            <button onClick={prevWeek}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#1A1A1A", color: "#fff" }}>
              {CHEVRON_LEFT}
            </button>
            <p className="text-[#666] text-xs font-semibold w-28 text-center">{weekLabel}</p>
            <button onClick={nextWeek}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#1A1A1A", color: "#fff", opacity: isCurrentOrFutureWeek ? 0.25 : 1 }}>
              {CHEVRON_RIGHT}
            </button>
          </div>
        )}
        {calView === "day" && (
          <p className="text-[#666] text-xs font-semibold">{dayLabel}</p>
        )}
        {calView === "month" && <div />}
      </div>

      {/* ── Animated calendar body ── */}
      <div className="flex flex-col gap-3 px-5 flex-1">
        <div key={animKey} className={animClass}>

          {/* ── MONTH VIEW ── */}
          {calView === "month" && (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A" }}>
                {/* DOW row */}
                <div className="grid grid-cols-7 px-2 pt-3 pb-1">
                  {DOW_LETTER.map((l, i) => (
                    <div key={i} className="flex items-center justify-center">
                      <span className="text-[10px] font-bold" style={{ color: "#2E2E2E" }}>{l}</span>
                    </div>
                  ))}
                </div>

                {/* Weeks — click row → week view */}
                <div className="flex flex-col px-2 pb-2" style={{ gap: 3 }}>
                  {calGrid.map((week, wi) => (
                    <div
                      key={wi}
                      className="grid grid-cols-7 rounded-xl cursor-pointer active:opacity-60 transition-opacity"
                      style={{ gap: 3 }}
                      onClick={() => openWeek(week[0])}
                    >
                      {week.map((date, di) => {
                        const inMonth = date.getMonth() === viewMonth;
                        const isToday = isSameDay(date, now);
                        const totals  = inMonth ? dayMap.get(dayKey(date)) : undefined;
                        const bg      = inMonth ? dayBg(totals) : "transparent";
                        return (
                          <div
                            key={di}
                            className="aspect-square rounded-lg flex items-center justify-center relative transition-all duration-150"
                            style={{ background: bg }}
                          >
                            {isToday && (
                              <div className="absolute inset-0 rounded-lg"
                                style={{ border: "1.5px solid rgba(255,255,255,0.55)" }} />
                            )}
                            {inMonth && (
                              <span className="text-[11px] font-semibold leading-none"
                                style={{ color: dayTextColor(totals, isToday) }}>
                                {date.getDate()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-4 pt-2 pb-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(244,63,94,0.45)" }} />
                    <span className="text-[9px] text-[#444] font-semibold">Spent more</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(34,197,94,0.25)" }} />
                    <span className="text-[9px] text-[#444] font-semibold">Earned more</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }} />
                    <span className="text-[9px] text-[#444] font-semibold">No activity</span>
                  </div>
                </div>
              </div>

              <StatsRow {...viewStats} />
              {monthTxns.length === 0 && (
                <p className="text-center text-[#2A2A2A] text-sm py-2">No transactions this month</p>
              )}
              {goals.length > 0 && <GoalsStrip goals={goals} />}
            </>
          )}

          {/* ── WEEK VIEW ── */}
          {calView === "week" && (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A" }}>
                <div className="grid grid-cols-7 p-3" style={{ gap: 5 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const date    = addDays(weekStart, i);
                    const isToday = isSameDay(date, now);
                    const totals  = dayMap.get(dayKey(date));
                    const bg      = dayBg(totals);
                    return (
                      <button
                        key={i}
                        onClick={() => openDay(date)}
                        className="flex flex-col items-center rounded-2xl py-4 active:scale-95 transition-all"
                        style={{
                          gap: 6,
                          background: bg,
                          border: isToday ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid transparent",
                        }}
                      >
                        <span className="text-[9px] font-bold uppercase"
                          style={{ color: isToday ? "#fff" : "#3A3A3A" }}>
                          {DOW_LABEL[date.getDay()].slice(0, 3)}
                        </span>
                        <span className="text-sm font-bold leading-none"
                          style={{ color: isToday ? "#fff" : totals ? "rgba(255,255,255,0.85)" : "#444" }}>
                          {date.getDate()}
                        </span>
                        {totals && (totals.expense > 0 || totals.income > 0) && (
                          <span className="text-[8px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {totals.expense > 0
                              ? `−₹${totals.expense >= 1000 ? `${Math.round(totals.expense / 1000)}k` : totals.expense}`
                              : `+₹${totals.income >= 1000 ? `${Math.round(totals.income / 1000)}k` : totals.income}`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <StatsRow {...viewStats} />
              {weekTxns.length === 0 && (
                <p className="text-center text-[#2A2A2A] text-sm py-2">Tap a day to see transactions</p>
              )}
              {goals.length > 0 && <GoalsStrip goals={goals} />}
            </>
          )}

          {/* ── DAY VIEW ── */}
          {calView === "day" && (
            <>
              <StatsRow {...viewStats} />
              <TxnList txns={dayTxns} userId={userId} />
            </>
          )}

        </div>
      </div>

      <BottomNav />

      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onChangePin={() => { setDrawerOpen(false); router.push("/settings"); }}
        onForgotPin={async () => {
          setDrawerOpen(false);
          if (user?.email) {
            try { await forgotPassword(user.email); } catch {}
            alert(`Reset email sent to ${user.email}`);
          }
        }}
        onSignOut={async () => { setDrawerOpen(false); await logout(); }}
        onReset={() => { setDrawerOpen(false); resetAccount(); }}
      />
    </div>
  );
}
