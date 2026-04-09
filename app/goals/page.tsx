"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import { addTransaction, subscribeToProfile, Account } from "@/lib/firestore";

/* ─── Local goal type (no Firebase Timestamps) ─── */
export interface LocalGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDateMs: number;   // Date.getTime()
  createdAtMs: number;    // Date.getTime()
}

/* ─── localStorage helpers ─── */
function goalsKey(userId: string) {
  return `tracksy_goals_${userId}`;
}
function loadGoals(userId: string): LocalGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(goalsKey(userId));
    return raw ? (JSON.parse(raw) as LocalGoal[]) : [];
  } catch {
    return [];
  }
}
function persistGoals(userId: string, goals: LocalGoal[]) {
  localStorage.setItem(goalsKey(userId), JSON.stringify(goals));
}

/* ─── Calculation helpers ─── */
function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface GoalStats {
  daysLeft: number;
  totalDays: number;
  daysElapsed: number;
  remaining: number;
  progressPct: number;
  adjustedDaily: number;
  originalDaily: number;
  deficit: number;
  isOverdue: boolean;
  isComplete: boolean;
  status: "complete" | "overdue" | "on-track" | "behind";
}

function calcStats(goal: LocalGoal): GoalStats {
  const now = today();
  const target = new Date(goal.targetDateMs);
  const created = new Date(goal.createdAtMs);

  const daysLeft = Math.max(0, daysBetween(now, target));
  const totalDays = Math.max(1, daysBetween(created, target));
  const daysElapsed = Math.max(0, totalDays - daysLeft);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progressPct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

  const isComplete = remaining === 0;
  const isOverdue = daysLeft === 0 && !isComplete;

  const originalDaily = goal.targetAmount / totalDays;
  const expectedByNow = originalDaily * daysElapsed;
  const deficit = Math.max(0, expectedByNow - goal.currentAmount);
  const adjustedDaily = daysLeft > 0 ? remaining / daysLeft : remaining;

  let status: GoalStats["status"] = "on-track";
  if (isComplete) status = "complete";
  else if (isOverdue) status = "overdue";
  else if (deficit > originalDaily * 0.5) status = "behind";

  return { daysLeft, totalDays, daysElapsed, remaining, progressPct, adjustedDaily, originalDaily, deficit, isOverdue, isComplete, status };
}

/* ─── Ring progress ─── */
function RingProgress({ pct, size = 60, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? "#22C55E" : "#FFFFFF"} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

/* ─── Status badge ─── */
function StatusBadge({ status, deficit }: { status: GoalStats["status"]; deficit: number }) {
  const map = {
    complete: { label: "Complete", bg: "rgba(34,197,94,0.12)", color: "#22C55E" },
    overdue: { label: "Overdue", bg: "rgba(244,63,94,0.12)", color: "#F43F5E" },
    "on-track": { label: "On Track", bg: "rgba(255,255,255,0.06)", color: "#666" },
    behind: { label: `₹${Math.round(deficit).toLocaleString("en-IN")} behind`, bg: "rgba(251,191,36,0.1)", color: "#FBBF24" },
  };
  const { label, bg, color } = map[status];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

/* ─── Goal Card ─── */
function GoalCard({
  goal,
  onDelete,
  onLogSavings,
}: {
  goal: LocalGoal;
  onDelete: (id: string) => void;
  onLogSavings: (id: string, newTotal: number, contribution: number) => void;
}) {
  const stats = calcStats(goal);
  const [expanded, setExpanded] = useState(false);
  const [logAmount, setLogAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLog = () => {
    const amt = parseFloat(logAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    const newTotal = Math.min(goal.currentAmount + amt, goal.targetAmount);
    const actualContribution = newTotal - goal.currentAmount;
    onLogSavings(goal.id, newTotal, actualContribution);
    setLogAmount("");
    setExpanded(false);
    setSaving(false);
  };

  const targetDate = new Date(goal.targetDateMs);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1A1A1A" }}>
      {/* Top */}
      <div className="p-4 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <RingProgress pct={stats.progressPct} />
          <div
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
            style={{ color: stats.isComplete ? "#22C55E" : "#fff" }}
          >
            {Math.round(stats.progressPct)}%
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
            <p className="text-white font-bold text-base truncate">{goal.name}</p>
            <StatusBadge status={stats.status} deficit={stats.deficit} />
          </div>
          <p className="text-[#555] text-xs">
            ₹{goal.currentAmount.toLocaleString("en-IN")} of ₹{goal.targetAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Daily strip */}
      {!stats.isComplete && (
        <div className="mx-4 mb-4 rounded-xl p-3 flex items-center justify-between gap-4" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div>
            <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-0.5">
              {stats.isOverdue ? "Overdue" : "Save daily"}
            </p>
            <p className="text-white font-bold text-xl leading-none">
              {stats.isOverdue
                ? "Passed"
                : `₹${Math.ceil(stats.adjustedDaily).toLocaleString("en-IN")}`}
            </p>
            {stats.status === "behind" && (
              <p className="text-[#555] text-[9px] line-through mt-0.5">
                was ₹{Math.ceil(stats.originalDaily).toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-0.5">Deadline</p>
            <p className="text-white font-semibold text-sm leading-none">
              {targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
            </p>
            <p className="text-[#555] text-[9px] mt-0.5">
              {stats.daysLeft > 0 ? `${stats.daysLeft} days left` : "Today"}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {!stats.isComplete && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.97] transition-all"
            style={{
              background: expanded ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {expanded ? "Cancel" : "+ Log Savings"}
          </button>
        )}
        <button
          onClick={() => onDelete(goal.id)}
          className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.12)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Log savings input */}
      {expanded && (
        <div className="px-4 pb-4 flex gap-2 step-forward">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="text-[#555]">₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Amount saved"
              value={logAmount}
              onChange={e => setLogAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLog()}
              autoFocus
              className="flex-1 bg-transparent outline-none text-white py-3 text-base"
            />
          </div>
          <button
            onClick={handleLog}
            disabled={!logAmount || parseFloat(logAmount) <= 0 || saving}
            className="px-5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: logAmount && parseFloat(logAmount) > 0 ? "#fff" : "rgba(255,255,255,0.07)",
              color: logAmount && parseFloat(logAmount) > 0 ? "#000" : "#444",
            }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Add Goal Form ─── */
function AddGoalForm({
  onSave,
  onCancel,
}: {
  onSave: (g: Omit<LocalGoal, "id" | "createdAtMs" | "currentAmount">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dateStr, setDateStr] = useState("");

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const canSubmit = name.trim().length > 0 && parseFloat(amount) > 0 && dateStr.length > 0;

  const dailyPreview = (() => {
    if (!canSubmit) return null;
    const deadline = new Date(dateStr + "T23:59:59");
    const daysLeft = Math.max(1, daysBetween(today(), deadline));
    return Math.ceil(parseFloat(amount) / daysLeft);
  })();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const deadline = new Date(dateStr + "T23:59:59");
    onSave({
      name: name.trim(),
      targetAmount: parseFloat(amount),
      targetDateMs: deadline.getTime(),
    });
  };

  return (
    <div className="modal-enter mx-5 mb-4 rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
      <p className="text-white font-bold text-base mb-4">New Goal</p>
      <div className="flex flex-col gap-3">

        <div>
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Goal name</p>
          <input
            type="text"
            placeholder="e.g. New Laptop, Trip to Goa…"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="w-full rounded-xl px-4 py-3.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        <div>
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Target amount (₹)</p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="10000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        <div>
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Deadline</p>
          <input
            type="date"
            min={minDate}
            value={dateStr}
            onChange={e => setDateStr(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-white text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              colorScheme: "dark",
            }}
          />
        </div>

        {dailyPreview !== null && (
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}
          >
            <p className="text-[#22C55E] text-sm font-semibold">Save per day</p>
            <p className="text-[#22C55E] font-bold">₹{dailyPreview.toLocaleString("en-IN")}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.97]"
            style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: canSubmit ? "#fff" : "rgba(255,255,255,0.07)",
              color: canSubmit ? "#000" : "#444",
            }}
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function GoalsPage() {
  const { userId, loading } = useAuth();
  const [goals, setGoals] = useState<LocalGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const accountsRef = useRef<Account[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!userId) return;
    setGoals(loadGoals(userId));
    // Subscribe to profile to get accounts for savings transactions
    const unsub = subscribeToProfile(userId, (profile) => {
      accountsRef.current = profile.accounts;
    });
    return unsub;
  }, [userId]);

  const save = useCallback((updated: LocalGoal[]) => {
    setGoals(updated);
    if (userId) persistGoals(userId, updated);
  }, [userId]);

  const handleAdd = (data: Omit<LocalGoal, "id" | "createdAtMs" | "currentAmount">) => {
    const newGoal: LocalGoal = {
      ...data,
      id: `goal_${Date.now()}`,
      currentAmount: 0,
      createdAtMs: Date.now(),
    };
    save([...goals, newGoal]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    save(goals.filter(g => g.id !== id));
  };

  const handleLogSavings = (id: string, newTotal: number, contribution: number) => {
    save(goals.map(g => g.id === id ? { ...g, currentAmount: newTotal } : g));
    // Also record as a Firestore transaction so it shows in the profile calendar
    if (userId && contribution > 0) {
      const firstAccount = accountsRef.current[0];
      if (firstAccount) {
        addTransaction(userId, {
          amount: contribution,
          type: "expense",
          category: "Savings",
          accountId: firstAccount.id,
        }).catch(() => {/* ignore if offline */});
      }
    }
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const totalDailyNeeded = activeGoals.reduce((s, g) => {
    const stats = calcStats(g);
    return s + (stats.daysLeft > 0 ? stats.adjustedDaily : 0);
  }, 0);

  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct  = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
  const behindGoals = goals.filter(g => calcStats(g).status === "behind").length;
  const overdueGoals = goals.filter(g => calcStats(g).isOverdue).length;
  const completedGoals = goals.filter(g => calcStats(g).isComplete).length;

  function getMotivation(): { msg: string; sub: string; color: string } {
    if (goals.length === 0) return { msg: "", sub: "", color: "" };
    if (completedGoals === goals.length) return {
      msg: "You actually did it. Every. Single. Goal. 🔥",
      sub: "Set harder ones. You're built different.",
      color: "#22C55E",
    };
    if (overdueGoals > 0) return {
      msg: `${overdueGoals} goal${overdueGoals > 1 ? "s are" : " is"} overdue. That stings.`,
      sub: "Stop scrolling Instagram and fix this. Seriously.",
      color: "#F43F5E",
    };
    if (behindGoals > 0 && overallPct < 20) return {
      msg: `₹${totalSaved.toLocaleString("en-IN")} saved. That's it??`,
      sub: "You've barely started. Stop bullshitting yourself and save something today.",
      color: "#F43F5E",
    };
    if (behindGoals > 0) return {
      msg: `You're ₹${(totalTarget - totalSaved).toLocaleString("en-IN")} behind. Wake up.`,
      sub: "You knew this would happen. Now do something about it.",
      color: "#FBBF24",
    };
    if (overallPct >= 80) return {
      msg: `${Math.round(overallPct)}% there. Don't you dare slow down now.`,
      sub: "You're so close it's stupid not to finish. Lock in.",
      color: "#22C55E",
    };
    if (overallPct >= 50) return {
      msg: `Halfway there. ₹${totalSaved.toLocaleString("en-IN")} saved.`,
      sub: "The second half always hurts more. That's exactly why you do it.",
      color: "#fff",
    };
    return {
      msg: `₹${totalSaved.toLocaleString("en-IN")} of ₹${totalTarget.toLocaleString("en-IN")} saved.`,
      sub: `Save ₹${Math.ceil(totalDailyNeeded).toLocaleString("en-IN")} today. No excuses. None.`,
      color: "#fff",
    };
  }

  const mot = goals.length > 0 ? getMotivation() : null;

  const sorted = [...goals].sort((a, b) => {
    const sa = calcStats(a), sb = calcStats(b);
    if (sa.isComplete !== sb.isComplete) return sa.isComplete ? 1 : -1;
    return sa.daysLeft - sb.daysLeft;
  });

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-2xl font-bold tracking-tight">Goals</p>
            <p className="text-[#555] text-sm mt-0.5">
              {goals.length === 0
                ? "Set a target, save daily"
                : `${activeGoals.length} active · ₹${Math.ceil(totalDailyNeeded).toLocaleString("en-IN")}/day`}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#fff" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* Summary strip */}
        {activeGoals.length > 0 && (
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">Still needed</p>
              <p className="text-white font-bold text-lg">
                ₹{activeGoals.reduce((s, g) => s + (g.targetAmount - g.currentAmount), 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">Save today</p>
              <p className="text-white font-bold text-lg">₹{Math.ceil(totalDailyNeeded).toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Motivation banner */}
      {mot && (
        <div className="px-5 mb-1 fade-up">
          <div
            className="rounded-2xl px-5 py-4"
            style={{
              background: mot.color === "#F43F5E"
                ? "rgba(244,63,94,0.07)"
                : mot.color === "#FBBF24"
                ? "rgba(251,191,36,0.07)"
                : mot.color === "#22C55E"
                ? "rgba(34,197,94,0.07)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                mot.color === "#F43F5E" ? "rgba(244,63,94,0.18)"
                : mot.color === "#FBBF24" ? "rgba(251,191,36,0.18)"
                : mot.color === "#22C55E" ? "rgba(34,197,94,0.18)"
                : "rgba(255,255,255,0.08)"
              }`,
            }}
          >
            <p className="font-bold text-base leading-snug mb-1" style={{ color: mot.color }}>{mot.msg}</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{mot.sub}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <AddGoalForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* List */}
      <div className="flex-1 px-5 flex flex-col gap-3">
        {goals.length === 0 && !showForm ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#1A1A1A" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" fill="#444" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">No goals yet</p>
              <p className="text-[#444] text-sm leading-relaxed">
                Set a savings target with a deadline.<br />
                Tracksy shows you exactly how much<br />to save every single day.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97]"
              style={{ background: "#fff", color: "#000" }}
            >
              Create First Goal
            </button>
          </div>
        ) : (
          sorted.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDelete}
              onLogSavings={handleLogSavings}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
