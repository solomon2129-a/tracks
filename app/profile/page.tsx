"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/TransactionItem";
import { subscribeToTransactions, deleteTransaction, Transaction } from "@/lib/firestore";

/* ─── Types ─── */
type CalView = "month" | "week" | "day";

/* ─── Date helpers ─── */
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}
function startOfWeekFromDate(d: Date) {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}
function filterRange(txns: Transaction[], from: Date, to: Date) {
  return txns.filter(t => {
    const d = t.createdAt?.toDate?.();
    return d && d >= from && d < to;
  });
}

/* ─── Calendar builder ─── */
function buildCalendarWeeks(year: number, month: number): (number | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDow).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

/* ─── Day totals map ─── */
function getDayTotals(txns: Transaction[], year: number, month: number) {
  const map: Record<number, { expense: number; income: number }> = {};
  for (const t of txns) {
    const d = t.createdAt?.toDate?.();
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    const day = d.getDate();
    if (!map[day]) map[day] = { expense: 0, income: 0 };
    if (t.type === "expense") map[day].expense += t.amount;
    else map[day].income += t.amount;
  }
  return map;
}

/* ─── Heat-map color ─── */
function heatColor(expense: number, income: number, maxExpense: number): string {
  if (expense === 0 && income === 0) return "rgba(255,255,255,0.05)";
  if (expense > 0) {
    const r = Math.min(expense / Math.max(maxExpense, 1), 1);
    if (r < 0.25) return "rgba(244,63,94,0.14)";
    if (r < 0.5)  return "rgba(244,63,94,0.28)";
    if (r < 0.75) return "rgba(244,63,94,0.44)";
    return "rgba(244,63,94,0.62)";
  }
  return "rgba(34,197,94,0.18)";
}

/* ─── Stats ─── */
function calcStats(txns: Transaction[]) {
  const income = txns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

/* ─── Grouped transactions ─── */
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

/* ─── Fmt ─── */
const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

/* ─── Stats Row ─── */
function StatsRow({ income, expenses, net }: { income: number; expenses: number; net: number }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: "#1A1A1A" }}>
      <p className="text-[#444] text-[9px] font-semibold tracking-widest uppercase mb-1">Net</p>
      <p className="font-bold leading-none mb-3 tracking-tight" style={{ fontSize: 32, color: net < 0 ? "#F43F5E" : "#fff" }}>
        {net < 0 ? "−" : "+"}{fmt(net)}
      </p>
      <div className="flex gap-4">
        <div>
          <p className="text-[#444] text-[9px] uppercase tracking-widest mb-0.5">Income</p>
          <p className="text-[#22C55E] font-bold text-sm tabular-nums">+{fmt(income)}</p>
        </div>
        <div className="w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div>
          <p className="text-[#444] text-[9px] uppercase tracking-widest mb-0.5">Spent</p>
          <p className="text-white font-bold text-sm tabular-nums">−{fmt(expenses)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Transaction list ─── */
function TxnList({ txns, userId }: { txns: Transaction[]; userId: string }) {
  if (txns.length === 0) {
    return <p className="text-center text-[#333] text-sm py-8">No transactions</p>;
  }
  const groups = groupByDate(txns);
  return (
    <div className="flex flex-col gap-3">
      {groups.map(group => (
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

/* ─── Profile Drawer ─── */
function ProfileDrawer({
  open,
  onClose,
  user,
  onChangePin,
  onForgotPin,
  onSignOut,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  user: { email?: string | null; metadata?: { creationTime?: string } } | null;
  onChangePin: () => void;
  onForgotPin: () => void;
  onSignOut: () => void;
  onReset: () => void;
}) {
  const [resetConfirm, setResetConfirm] = useState(false);

  if (!open) return null;

  const email = user?.email || "";
  const initial = email.charAt(0).toUpperCase() || "?";
  const memberSince = (() => {
    try {
      const t = user?.metadata?.creationTime;
      if (!t) return "—";
      return new Date(t).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    } catch { return "—"; }
  })();

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 4000); return; }
    onReset();
  };

  const Row = ({ icon, label, color = "#fff", onClick }: { icon: React.ReactNode; label: string; color?: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-4 active:opacity-60 transition-opacity text-left"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
        {icon}
      </div>
      <span className="font-semibold text-sm" style={{ color }}>{label}</span>
      <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 fade-in"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto sheet-up rounded-t-3xl pb-safe"
        style={{ background: "#141414", paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-5">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        <div className="px-6">
          {/* Avatar + info */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#2A2A2A" }}
            >
              <span className="text-white font-bold text-2xl">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-base truncate">{email}</p>
              <p className="text-[#444] text-xs mt-0.5">Member since {memberSince}</p>
            </div>
          </div>

          {/* Actions */}
          <Row
            onClick={onChangePin}
            label="Change PIN"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />
          <Row
            onClick={onForgotPin}
            label="Forgot PIN"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />
          <Row
            onClick={onSignOut}
            label="Sign Out"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            }
          />
          <Row
            onClick={handleReset}
            label={resetConfirm ? "Tap again to confirm reset" : "Reset Account"}
            color={resetConfirm ? "#F43F5E" : "#F43F5E"}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
              </svg>
            }
          />
        </div>
      </div>
    </>
  );
}

/* ─── Page ─── */
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function ProfilePage() {
  const { userId, loading, user, lock, logout, forgotPassword, resetAccount } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calView, setCalView] = useState<CalView>("month");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [calKey, setCalKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    return subscribeToTransactions(userId, setTransactions);
  }, [userId]);

  const navigate = useCallback((view: CalView, key?: number) => {
    setCalView(view);
    setCalKey(k => k + 1);
  }, []);

  const goToWeek = (weekStart: Date) => {
    setSelectedWeekStart(weekStart);
    navigate("week");
  };

  const goToDay = (date: Date) => {
    setSelectedDay(date);
    const ws = startOfWeekFromDate(date);
    setSelectedWeekStart(ws);
    navigate("day");
  };

  const goBack = () => {
    if (calView === "day") navigate("week");
    else if (calView === "week") navigate("month");
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    if (next <= new Date()) setViewDate(next);
  };

  const handleForgotPin = async () => {
    if (!user?.email) return;
    setDrawerOpen(false);
    try { await forgotPassword(user.email); } catch { /* ignore */ }
    alert(`Password reset email sent to ${user.email}`);
  };

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await logout();
  };

  const handleReset = () => {
    setDrawerOpen(false);
    resetAccount();
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // ── Data per view ──
  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd = new Date(viewYear, viewMonth + 1, 1);
  const monthTxns = filterRange(transactions, monthStart, monthEnd);
  const dayTotals = getDayTotals(transactions, viewYear, viewMonth);
  const maxExpense = Math.max(...Object.values(dayTotals).map(d => d.expense), 1);
  const calWeeks = buildCalendarWeeks(viewYear, viewMonth);

  // Week view data
  const weekTxns = selectedWeekStart
    ? filterRange(transactions, selectedWeekStart, new Date(selectedWeekStart.getTime() + 7 * 86400000))
    : [];

  // Day view data
  const dayTxns = selectedDay
    ? filterRange(transactions, startOfDay(selectedDay), endOfDay(selectedDay))
    : [];

  const viewStats = calView === "day" ? calcStats(dayTxns)
    : calView === "week" ? calcStats(weekTxns)
    : calcStats(monthTxns);

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const isNextMonthAllowed = !isCurrentMonth;

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-2xl tracking-tight">Spending</p>
          <p className="text-[#444] text-sm mt-0.5">Track where your money goes</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: "#1A1A1A" }}
        >
          <span className="text-white font-bold text-base leading-none">
            {(user?.email?.charAt(0) || "?").toUpperCase()}
          </span>
        </button>
      </div>

      {/* ── Calendar section ── */}
      <div className="flex flex-col gap-3 px-5 flex-1">

        {/* Month nav header */}
        <div className="flex items-center justify-between">
          {calView !== "month" ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 active:scale-95 transition-transform"
              style={{ color: "#888" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="text-sm font-semibold">
                {calView === "day" ? "Week" : "Month"}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90"
                style={{ background: "#1A1A1A" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <p className="text-white font-semibold text-sm min-w-[120px] text-center">
                {viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-opacity"
                style={{ background: "#1A1A1A", opacity: isNextMonthAllowed ? 1 : 0.25 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          {calView !== "month" && (
            <p className="text-[#555] text-sm font-semibold">
              {calView === "week" && selectedWeekStart
                ? `${selectedWeekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${new Date(selectedWeekStart.getTime() + 6 * 86400000).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                : calView === "day" && selectedDay
                ? selectedDay.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })
                : ""}
            </p>
          )}
        </div>

        {/* ── Calendar body ── */}
        <div key={calKey} className="fade-in">

          {/* Month view */}
          {calView === "month" && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A" }}>
              {/* DOW headers */}
              <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                {DOW.map((d, i) => (
                  <div key={i} className="flex items-center justify-center">
                    <span className="text-[10px] font-semibold" style={{ color: "#3A3A3A" }}>{d}</span>
                  </div>
                ))}
              </div>
              {/* Weeks */}
              <div className="flex flex-col gap-1 px-3 pb-3">
                {calWeeks.map((week, wi) => {
                  const weekStart = (() => {
                    const firstDay = week.find(d => d !== null);
                    if (firstDay === null || firstDay === undefined) return null;
                    return new Date(viewYear, viewMonth, firstDay as number - (week.indexOf(firstDay)));
                  })();
                  return (
                    <div
                      key={wi}
                      className="grid grid-cols-7 gap-1 rounded-xl cursor-pointer active:opacity-70 transition-opacity"
                      onClick={() => {
                        // Find first valid day in this week
                        const firstDay = week.find(d => d !== null);
                        if (firstDay) {
                          const d = new Date(viewYear, viewMonth, firstDay as number);
                          const ws = new Date(d);
                          ws.setDate(ws.getDate() - week.indexOf(firstDay));
                          goToWeek(ws);
                        }
                      }}
                    >
                      {week.map((day, di) => {
                        const isToday = day !== null && isCurrentMonth && day === now.getDate();
                        const totals = day ? dayTotals[day] : null;
                        const bg = totals ? heatColor(totals.expense, totals.income, maxExpense) : "transparent";
                        return (
                          <div
                            key={di}
                            className="aspect-square rounded-lg flex items-center justify-center relative transition-all duration-150"
                            style={{ background: day ? bg : "transparent" }}
                            onClick={day ? (e) => { e.stopPropagation(); goToDay(new Date(viewYear, viewMonth, day)); } : undefined}
                          >
                            {isToday && (
                              <div className="absolute inset-0 rounded-lg" style={{ border: "1.5px solid rgba(255,255,255,0.5)" }} />
                            )}
                            {day && (
                              <span
                                className="text-xs font-semibold"
                                style={{ color: isToday ? "#fff" : totals?.expense ? "rgba(255,255,255,0.9)" : "#444" }}
                              >
                                {day}
                              </span>
                            )}
                            {(totals?.income ?? 0) > 0 && (totals?.expense ?? 0) === 0 && (
                              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "#22C55E" }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-4 pb-3 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(244,63,94,0.5)" }} />
                  <span className="text-[9px] text-[#444] font-semibold">High spend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(34,197,94,0.18)" }} />
                  <span className="text-[9px] text-[#444] font-semibold">Income only</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ border: "1.5px solid rgba(255,255,255,0.4)" }} />
                  <span className="text-[9px] text-[#444] font-semibold">Today</span>
                </div>
              </div>
            </div>
          )}

          {/* Week view */}
          {calView === "week" && selectedWeekStart && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A" }}>
              <div className="grid grid-cols-7 gap-1 p-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(selectedWeekStart.getTime() + i * 86400000);
                  const totals = getDayTotals(transactions, d.getFullYear(), d.getMonth())[d.getDate()];
                  const bg = totals ? heatColor(totals.expense, totals.income, maxExpense) : "rgba(255,255,255,0.04)";
                  const isToday = d.toDateString() === now.toDateString();
                  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
                  return (
                    <button
                      key={i}
                      onClick={() => goToDay(d)}
                      className="flex flex-col items-center gap-1.5 rounded-2xl py-4 active:scale-95 transition-all"
                      style={{
                        background: bg,
                        border: isToday ? "1.5px solid rgba(255,255,255,0.4)" : "1px solid transparent",
                      }}
                    >
                      <span className="text-[9px] font-bold" style={{ color: "#444" }}>{dayLabels[d.getDay()]}</span>
                      <span className="text-sm font-bold" style={{ color: isToday ? "#fff" : "#bbb" }}>{d.getDate()}</span>
                      {totals?.expense > 0 && (
                        <span className="text-[8px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
                          ₹{Math.round(totals.expense / 1000) > 0 ? `${Math.round(totals.expense / 1000)}k` : totals.expense}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day view stats (shown for week and day) */}
          {(calView === "week" || calView === "day") && (
            <StatsRow income={viewStats.income} expenses={viewStats.expenses} net={viewStats.net} />
          )}

          {/* Day view transactions */}
          {calView === "day" && (
            <TxnList txns={dayTxns} userId={userId} />
          )}

          {/* Month stats */}
          {calView === "month" && (
            <StatsRow income={viewStats.income} expenses={viewStats.expenses} net={viewStats.net} />
          )}

          {/* Week hint */}
          {calView === "week" && (
            <p className="text-center text-[#2A2A2A] text-xs">Tap a day to see its transactions</p>
          )}

          {/* Month hint */}
          {calView === "month" && monthTxns.length === 0 && (
            <p className="text-center text-[#333] text-sm py-4">No transactions this month</p>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Profile Drawer */}
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onChangePin={() => { setDrawerOpen(false); router.push("/settings"); }}
        onForgotPin={handleForgotPin}
        onSignOut={handleSignOut}
        onReset={handleReset}
      />
    </div>
  );
}
