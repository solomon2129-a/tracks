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

type CalView = "month" | "week" | "day";
type Dir     = "forward" | "back";

/* ─── Date utils ─── */
const sod        = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const eod        = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
const isSameDay  = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sundayOf   = (d: Date) => { const s = sod(d); s.setDate(s.getDate() - s.getDay()); return s; };
const addDays    = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmt        = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

function filterRange(txns: Transaction[], from: Date, to: Date) {
  return txns.filter(t => { const d = t.createdAt?.toDate?.(); return d && d >= from && d < to; });
}

/* ─── Calendar grid (full Date objects, Sun–Sat rows) ─── */
function buildMonthGrid(year: number, month: number): Date[][] {
  const first       = new Date(year, month, 1);
  const startSunday = sundayOf(first);
  const totalWeeks  = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7);
  return Array.from({ length: totalWeeks }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => addDays(startSunday, wi * 7 + di))
  );
}

/* ─── Day colour ─── */
type DayTotals = { expense: number; income: number };

function buildDayMap(txns: Transaction[]): Map<string, DayTotals> {
  const m = new Map<string, DayTotals>();
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d) continue;
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const c = m.get(k) ?? { expense: 0, income: 0 };
    if (t.type === "expense") c.expense += t.amount; else c.income += t.amount;
    m.set(k, c);
  }
  return m;
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function dayBg(t: DayTotals | undefined): string {
  if (!t || (!t.expense && !t.income)) return "rgba(255,255,255,0.05)";
  if (t.income > t.expense) return "rgba(34,197,94,0.22)";
  const r = t.expense / Math.max(t.expense + t.income, 1);
  return r < 0.7 ? "rgba(244,63,94,0.20)" : r < 0.9 ? "rgba(244,63,94,0.34)" : "rgba(244,63,94,0.52)";
}
function dayText(t: DayTotals | undefined, isToday: boolean) {
  if (isToday) return "#fff";
  return (!t || (!t.expense && !t.income)) ? "#333" : "rgba(255,255,255,0.8)";
}

/* ─── Stats ─── */
function calcStats(txns: Transaction[]) {
  const income   = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const saved    = txns.filter(t => t.type === "expense" && t.category === "Savings").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === "expense" && t.category !== "Savings").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, saved, net: income - expenses - saved };
}

/* ─── Group txns by date ─── */
function groupByDate(txns: Transaction[]) {
  const m = new Map<string, { label: string; dateObj: Date; items: Transaction[] }>();
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d) continue;
    const k = d.toDateString();
    if (!m.has(k)) m.set(k, {
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      dateObj: d, items: [],
    });
    m.get(k)!.items.push(t);
  }
  return Array.from(m.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

const DOW_L = ["S","M","T","W","T","F","S"];
const DOW_S = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ══════════════════════════════════════
   Stats Card — income + spent + goals
══════════════════════════════════════ */
function StatsCard({ income, expenses, saved, net, goals }: {
  income: number; expenses: number; saved: number; net: number; goals: LocalGoal[];
}) {
  const totalGoalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalGoalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const goalPct         = totalGoalTarget > 0 ? Math.min(100, (totalGoalSaved / totalGoalTarget) * 100) : 0;
  const hasGoals        = totalGoalTarget > 0;

  // bar widths relative to income (capped at 100%)
  const base    = Math.max(income, expenses + saved, 1);
  const incPct  = Math.min(100, (income / base) * 100);
  const expPct  = Math.min(100, (expenses / base) * 100);
  const savPct  = Math.min(100, (saved / base) * 100);

  return (
    <div className="glow-card rounded-2xl p-5 fade-up" style={{ background: "#1A1A1A" }}>
      {/* Net */}
      <p className="text-[#3A3A3A] text-[9px] font-bold tracking-widest uppercase mb-1">Net Balance</p>
      <p className={`font-bold tracking-tight leading-none mb-5 ${net < 0 ? "text-glow-red" : net > 0 ? "text-glow-white" : ""}`}
        style={{ fontSize: 38, color: net < 0 ? "#F43F5E" : net > 0 ? "#fff" : "#555" }}>
        {net < 0 ? "−" : net > 0 ? "+" : ""}{fmt(net)}
      </p>

      {/* Rows */}
      <div className="flex flex-col gap-3.5">
        {/* Income */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#3A3A3A" }}>Income</span>
            <span className="text-xs font-bold tabular-nums text-glow-green" style={{ color: "#22C55E" }}>+{fmt(income)}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div style={{ width: `${incPct}%`, height: "100%", borderRadius: 9999, background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.8), 0 0 20px rgba(34,197,94,0.3)", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Spent */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#3A3A3A" }}>Spent</span>
            <span className="text-xs font-bold tabular-nums text-white">−{fmt(expenses)}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div style={{ width: `${expPct}%`, height: "100%", borderRadius: 9999, background: "#F43F5E", boxShadow: "0 0 8px rgba(244,63,94,0.8), 0 0 20px rgba(244,63,94,0.3)", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Saved (from goal contributions) */}
        {saved > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#3A3A3A" }}>Saved</span>
              <span className="text-xs font-bold tabular-nums" style={{ color: "#818CF8" }}>−{fmt(saved)}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div style={{ width: `${savPct}%`, height: "100%", borderRadius: 9999, background: "#818CF8", boxShadow: "0 0 8px rgba(129,140,248,0.8), 0 0 20px rgba(129,140,248,0.3)", transition: "width 0.6s ease" }} />
            </div>
          </div>
        )}

        {/* Goals overall progress */}
        {hasGoals && (
          <>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#3A3A3A" }}>Goals</span>
                <span className="text-xs font-bold tabular-nums text-glow-yellow" style={{ color: "#FBBF24" }}>
                  {fmt(totalGoalSaved)} <span style={{ color: "#3A3A3A" }}>/ {fmt(totalGoalTarget)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${goalPct}%`, height: "100%", borderRadius: 9999, background: "#FBBF24", boxShadow: "0 0 8px rgba(251,191,36,0.8), 0 0 20px rgba(251,191,36,0.3)", transition: "width 0.7s ease" }} />
              </div>
              <p className="text-[9px] mt-1" style={{ color: "#3A3A3A" }}>{Math.round(goalPct)}% of total target saved</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Txn list ─── */
function TxnList({ txns, userId }: { txns: Transaction[]; userId: string }) {
  if (!txns.length) return <p className="text-center py-8 text-sm" style={{ color: "#2A2A2A" }}>No transactions</p>;
  return (
    <div className="flex flex-col gap-3">
      {groupByDate(txns).map(g => (
        <div key={g.label}>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#2A2A2A" }}>{g.label}</p>
          <div className="rounded-2xl px-4" style={{ background: "#1A1A1A" }}>
            {g.items.map((t, i) => (
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

/* ─── Profile Drawer ─── */
function ProfileDrawer({ open, onClose, user, onReminders, onChangePin, onForgotPin, onSignOut, onReset }: {
  open: boolean; onClose: () => void;
  user: { email?: string | null; metadata?: { creationTime?: string } } | null;
  onReminders: () => void; onChangePin: () => void; onForgotPin: () => void; onSignOut: () => void; onReset: () => void;
}) {
  const [resetConfirm, setResetConfirm] = useState(false);
  if (!open) return null;
  const email  = user?.email || "";
  const init   = email.charAt(0).toUpperCase() || "?";
  const since  = (() => {
    try { const t = user?.metadata?.creationTime; return t ? new Date(t).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"; }
    catch { return "—"; }
  })();
  const Row = ({ icon, label, color = "#fff", onClick }: { icon: React.ReactNode; label: string; color?: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 py-4 active:opacity-50 transition-opacity"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>{icon}</div>
      <span className="font-semibold text-sm flex-1 text-left" style={{ color }}>{label}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
    </button>
  );
  return (
    <>
      <div className="fixed inset-0 z-50 fade-in" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto sheet-up rounded-t-[28px]"
        style={{ background: "#111", paddingBottom: "calc(32px + env(safe-area-inset-bottom,0px))" }}>
        <div className="flex justify-center pt-3 pb-6">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div className="px-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#222" }}>
              <span className="text-white font-bold text-xl">{init}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{email}</p>
              <p className="text-xs mt-0.5" style={{ color: "#3A3A3A" }}>Member since {since}</p>
            </div>
          </div>
          <Row onClick={onReminders} label="Reminders"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} />
          <Row onClick={onChangePin} label="Change PIN"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
          <Row onClick={onForgotPin} label="Forgot PIN"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
          <Row onClick={onSignOut} label="Sign Out"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} />
          <Row onClick={() => { if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 4000); } else onReset(); }}
            label={resetConfirm ? "Tap again to confirm" : "Reset Account"} color="#F43F5E"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>} />
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════
   Page
════════════════════════════════════ */
const CL = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const CR = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

export default function ProfilePage() {
  const { userId, loading, user, logout, forgotPassword, resetAccount } = useAuth();
  const router = useRouter();

  const [txns, setTxns]           = useState<Transaction[]>([]);
  const [goals, setGoals]         = useState<LocalGoal[]>([]);
  const [calView, setCalView]     = useState<CalView>("month");
  const [animDir, setAnimDir]     = useState<Dir>("forward");
  const [animKey, setAnimKey]     = useState(0);
  const [drawerOpen, setDrawer]   = useState(false);

  const [viewDate, setViewDate]   = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [weekStart, setWeekStart] = useState(() => sundayOf(new Date()));
  const [selDay, setSelDay]       = useState(() => sod(new Date()));

  useEffect(() => {
    if (!userId) return;
    setGoals(loadGoals(userId));
    return subscribeToTransactions(userId, setTxns);
  }, [userId]);

  function go(view: CalView, dir: Dir) { setAnimDir(dir); setAnimKey(k => k + 1); setCalView(view); }

  const jumpToToday = () => {
    const today = sod(new Date());
    setSelDay(today);
    setWeekStart(sundayOf(today));
    go("day", "forward");
  };

  function openWeek(ws: Date) { setWeekStart(ws); go("week", "forward"); }
  function openDay(d: Date)   { setSelDay(sod(d)); go("day", "forward"); }
  function goBack()           { calView === "day" ? go("week", "back") : go("month", "back"); }

  function prevWeek() { setWeekStart(w => addDays(w, -7)); setAnimKey(k => k + 1); setAnimDir("back"); }
  function nextWeek() {
    const nw = addDays(weekStart, 7);
    if (nw <= new Date()) { setWeekStart(nw); setAnimKey(k => k + 1); setAnimDir("forward"); }
  }
  function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() {
    const n = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    if (n <= new Date()) setViewDate(n);
  }

  if (loading || !userId) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  const now       = new Date();
  const vYear     = viewDate.getFullYear();
  const vMonth    = viewDate.getMonth();
  const isThisMon = vYear === now.getFullYear() && vMonth === now.getMonth();
  const isThisWk  = addDays(weekStart, 7) > now;

  const dayMap    = buildDayMap(txns);
  const calGrid   = buildMonthGrid(vYear, vMonth);
  const monthTxns = filterRange(txns, new Date(vYear, vMonth, 1), new Date(vYear, vMonth + 1, 1));
  const weekTxns  = filterRange(txns, weekStart, addDays(weekStart, 7));
  const dayTxns   = filterRange(txns, selDay, eod(selDay));

  const stats = calView === "day" ? calcStats(dayTxns)
    : calView === "week" ? calcStats(weekTxns)
    : calcStats(monthTxns);

  const weekLabel = `${weekStart.toLocaleDateString("en-IN",{month:"short",day:"numeric"})} – ${addDays(weekStart,6).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}`;
  const dayLabel  = selDay.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-2xl tracking-tight">Overview</p>
          <p className="text-[#333] text-xs mt-0.5 font-medium">
            {calView === "month" ? viewDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"})
              : calView === "week" ? weekLabel
              : dayLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Today shortcut */}
          <button onClick={jumpToToday}
            className="px-3 h-8 rounded-xl text-xs font-bold active:scale-90 transition-transform"
            style={{ background: "#1A1A1A", color: "#888" }}>
            Today
          </button>
          {/* Avatar / profile drawer */}
          <button onClick={() => setDrawer(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "#1A1A1A" }}>
            <span className="text-white font-bold text-sm leading-none">
              {(user?.email?.charAt(0) || "?").toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      {/* ── Nav bar ── */}
      <div className="px-5 flex items-center justify-between h-9 mb-2">
        {calView === "month" ? (
          <div className="flex items-center gap-1.5">
            <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
              style={{ background: "#1A1A1A", color: "#fff" }}>{CL}</button>
            <p className="text-white font-semibold text-xs w-28 text-center">
              {viewDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}
            </p>
            <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
              style={{ background: "#1A1A1A", color: "#fff", opacity: isThisMon ? 0.2 : 1 }}>{CR}</button>
          </div>
        ) : (
          <button onClick={goBack} className="flex items-center gap-1 px-2.5 h-7 rounded-lg active:scale-95"
            style={{ background: "#1A1A1A", color: "#666" }}>
            {CL}
            <span className="text-xs font-semibold">{calView === "day" ? "Week" : "Month"}</span>
          </button>
        )}

        {calView === "week" && (
          <div className="flex items-center gap-1.5">
            <button onClick={prevWeek} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
              style={{ background: "#1A1A1A", color: "#fff" }}>{CL}</button>
            <p className="text-xs font-semibold w-28 text-center" style={{ color: "#555" }}>{weekLabel}</p>
            <button onClick={nextWeek} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90"
              style={{ background: "#1A1A1A", color: "#fff", opacity: isThisWk ? 0.2 : 1 }}>{CR}</button>
          </div>
        )}
        {calView === "month" && <div />}
        {calView === "day" && <p className="text-xs font-semibold" style={{ color: "#444" }}>{dayLabel}</p>}
      </div>

      {/* ── Body (animated) ── */}
      <div className="flex flex-col gap-3 px-5 flex-1">
        <div key={animKey} className={animDir === "forward" ? "cal-slide-forward" : "cal-slide-back"}>

          {/* ── MONTH ── */}
          {calView === "month" && (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#161616" }}>
                {/* DOW */}
                <div className="grid grid-cols-7 px-2 pt-3 pb-1">
                  {DOW_L.map((l, i) => (
                    <div key={i} className="flex items-center justify-center">
                      <span className="text-[10px] font-bold" style={{ color: "#282828" }}>{l}</span>
                    </div>
                  ))}
                </div>
                {/* Week rows */}
                <div className="flex flex-col px-2 pb-2" style={{ gap: 3 }}>
                  {calGrid.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 rounded-xl cursor-pointer active:opacity-60 transition-opacity"
                      style={{ gap: 3 }}
                      onClick={() => openWeek(week[0])}>
                      {week.map((date, di) => {
                        const inMonth = date.getMonth() === vMonth;
                        const isToday = isSameDay(date, now);
                        const totals  = inMonth ? dayMap.get(dayKey(date)) : undefined;
                        return (
                          <div key={di} className="aspect-square rounded-lg flex items-center justify-center relative"
                            style={{ background: inMonth ? dayBg(totals) : "transparent" }}>
                            {isToday && <div className="absolute inset-0 rounded-lg" style={{ border: "1.5px solid rgba(255,255,255,0.5)" }} />}
                            {inMonth && (
                              <span className="text-[11px] font-semibold" style={{ color: dayText(totals, isToday) }}>
                                {date.getDate()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <StatsCard {...stats} goals={goals} />
              {!monthTxns.length && <p className="text-center text-sm py-1" style={{ color: "#242424" }}>No transactions this month</p>}
            </>
          )}

          {/* ── WEEK ── */}
          {calView === "week" && (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#161616" }}>
                <div className="grid grid-cols-7 p-2.5" style={{ gap: 4 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const date    = addDays(weekStart, i);
                    const isToday = isSameDay(date, now);
                    const totals  = dayMap.get(dayKey(date));
                    const amt     = totals ? (totals.expense > totals.income
                      ? `−₹${totals.expense >= 1000 ? `${(totals.expense/1000).toFixed(1)}k` : totals.expense}`
                      : `+₹${totals.income >= 1000  ? `${(totals.income/1000).toFixed(1)}k`  : totals.income}`)
                      : null;
                    return (
                      <button key={i} onClick={() => openDay(date)}
                        className="flex flex-col items-center rounded-2xl py-4 active:scale-95 transition-all"
                        style={{ gap: 5, background: dayBg(totals), border: isToday ? "1.5px solid rgba(255,255,255,0.45)" : "1px solid transparent" }}>
                        <span className="text-[8px] font-bold uppercase" style={{ color: isToday ? "#aaa" : "#2E2E2E" }}>{DOW_S[date.getDay()].slice(0,3)}</span>
                        <span className="text-sm font-bold" style={{ color: isToday ? "#fff" : (totals ? "rgba(255,255,255,0.8)" : "#3A3A3A") }}>{date.getDate()}</span>
                        {amt && <span className="text-[7px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.35)" }}>{amt}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <StatsCard {...stats} goals={goals} />
              {!weekTxns.length && <p className="text-center text-sm py-1" style={{ color: "#242424" }}>Tap a day to see transactions</p>}
            </>
          )}

          {/* ── DAY ── */}
          {calView === "day" && (
            <>
              <StatsCard {...stats} goals={goals} />
              <TxnList txns={dayTxns} userId={userId} />
            </>
          )}

        </div>
      </div>

      <BottomNav />

      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawer(false)}
        user={user}
        onReminders={() => { setDrawer(false); router.push("/settings"); }}
        onChangePin={() => { setDrawer(false); router.push("/settings?tab=account"); }}
        onForgotPin={async () => {
          setDrawer(false);
          if (user?.email) { try { await forgotPassword(user.email); } catch {} alert(`Reset email sent to ${user.email}`); }
        }}
        onSignOut={async () => { setDrawer(false); await logout(); }}
        onReset={() => { setDrawer(false); resetAccount(); }}
      />
    </div>
  );
}
