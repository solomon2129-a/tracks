"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import { subscribeToProfile, updateGoals, Goal } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";

/* ─── helpers ─── */

function daysBetween(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
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
  adjustedDaily: number;   // what you must save per day NOW to still hit target
  originalDaily: number;   // what you were supposed to save per day from the start
  deficit: number;         // how much you're behind expected
  isOverdue: boolean;
  isComplete: boolean;
  status: "complete" | "overdue" | "on-track" | "behind";
}

function calcStats(goal: Goal): GoalStats {
  const now = today();
  const target = goal.targetDate?.toDate?.();
  const created = goal.createdAt?.toDate?.() ?? now;

  if (!target) {
    return {
      daysLeft: 0, totalDays: 0, daysElapsed: 0,
      remaining: goal.targetAmount - goal.currentAmount,
      progressPct: (goal.currentAmount / goal.targetAmount) * 100,
      adjustedDaily: 0, originalDaily: 0, deficit: 0,
      isOverdue: false, isComplete: false, status: "on-track",
    };
  }

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
function RingProgress({ pct, size = 64, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 100 ? "#22C55E" : "#FFFFFF";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
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
    "on-track": { label: "On Track", bg: "rgba(255,255,255,0.06)", color: "#888" },
    behind: { label: `₹${Math.round(deficit).toLocaleString("en-IN")} behind`, bg: "rgba(251,191,36,0.1)", color: "#FBBF24" },
  };
  const { label, bg, color } = map[status];
  return (
    <span
      className="text-[10px] font-bold px-2 py-1 rounded-full"
      style={{ background: bg, color }}
    >
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
  goal: Goal;
  onDelete: (id: string) => void;
  onLogSavings: (id: string, amount: number) => void;
}) {
  const stats = calcStats(goal);
  const [expanded, setExpanded] = useState(false);
  const [logAmount, setLogAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLog = async () => {
    const amt = parseFloat(logAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    await onLogSavings(goal.id, goal.currentAmount + amt);
    setLogAmount("");
    setExpanded(false);
    setSaving(false);
  };

  const targetDate = goal.targetDate?.toDate?.();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#1A1A1A" }}
    >
      {/* Top row */}
      <div className="p-4 flex items-center gap-3">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <RingProgress pct={stats.progressPct} size={60} stroke={4} />
          <div
            className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
            style={{ color: stats.isComplete ? "#22C55E" : "#fff" }}
          >
            {Math.round(stats.progressPct)}%
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-white font-bold text-base truncate">{goal.name}</p>
            <StatusBadge status={stats.status} deficit={stats.deficit} />
          </div>
          <p className="text-[#555] text-[11px]">
            ₹{goal.currentAmount.toLocaleString("en-IN")} of ₹{goal.targetAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Daily info strip */}
      {!stats.isComplete && (
        <div
          className="mx-4 mb-4 rounded-xl p-3 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div>
            <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-0.5">
              {stats.isOverdue ? "Overdue by" : "Save daily"}
            </p>
            <p className="text-white font-bold text-lg leading-none">
              {stats.isOverdue
                ? `${daysBetween(targetDate!, today())} days`
                : `₹${Math.ceil(stats.adjustedDaily).toLocaleString("en-IN")}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-0.5">
              {stats.daysLeft > 0 ? "Days left" : "Deadline"}
            </p>
            <p className="text-white font-semibold text-sm leading-none">
              {stats.daysLeft > 0
                ? `${stats.daysLeft}d`
                : targetDate?.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) ?? "—"}
            </p>
          </div>
          {stats.status === "behind" && (
            <div className="text-right">
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-0.5">Original</p>
              <p className="text-[#555] text-sm leading-none line-through">
                ₹{Math.ceil(stats.originalDaily).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Log savings + delete row */}
      <div className="px-4 pb-4 flex gap-2">
        {!stats.isComplete && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.97] transition-all"
            style={{
              background: expanded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              color: "#fff",
            }}
          >
            {expanded ? "Cancel" : "Log Savings"}
          </button>
        )}
        <button
          onClick={() => onDelete(goal.id)}
          className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          style={{ background: "rgba(244,63,94,0.08)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Expand: log savings */}
      {expanded && (
        <div className="px-4 pb-4 flex gap-2 step-forward">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="text-[#555] text-base">₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Amount saved"
              value={logAmount}
              onChange={e => setLogAmount(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent outline-none text-white text-base py-3"
            />
          </div>
          <button
            onClick={handleLog}
            disabled={!logAmount || parseFloat(logAmount) <= 0 || saving}
            className="px-5 py-3 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: logAmount && parseFloat(logAmount) > 0 ? "#fff" : "rgba(255,255,255,0.07)",
              color: logAmount && parseFloat(logAmount) > 0 ? "#000" : "#444",
            }}
          >
            {saving ? "…" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Add Goal Sheet ─── */
function AddGoalSheet({
  onSave,
  onCancel,
}: {
  onSave: (data: { name: string; targetAmount: number; targetDate: Date }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const canSubmit = name.trim().length > 0 && parseFloat(amount) > 0 && dateStr.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount: parseFloat(amount),
        targetDate: new Date(dateStr),
      });
    } catch {
      setError("Failed to create goal. Try again.");
      setSaving(false);
    }
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
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Target amount</p>
          <div
            className="flex items-center gap-2 rounded-xl px-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="text-[#555] text-base">₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white text-sm py-3.5"
            />
          </div>
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

        {/* Preview daily amount */}
        {canSubmit && (() => {
          const deadline = new Date(dateStr);
          const now = today();
          const daysLeft = Math.max(1, daysBetween(now, deadline));
          const daily = parseFloat(amount) / daysLeft;
          return (
            <div
              className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}
            >
              <p className="text-[#22C55E] text-xs font-semibold">Save per day</p>
              <p className="text-[#22C55E] font-bold text-sm">₹{Math.ceil(daily).toLocaleString("en-IN")}</p>
            </div>
          );
        })()}

        {error && <p className="text-[#F43F5E] text-xs">{error}</p>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm"
            style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: canSubmit ? "#fff" : "rgba(255,255,255,0.07)",
              color: canSubmit ? "#000" : "#444",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Creating…" : "Create Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function GoalsPage() {
  const { userId, loading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    return subscribeToProfile(userId, (profile) => {
      setGoals(profile.goals ?? []);
    });
  }, [userId]);

  const handleAddGoal = async (data: { name: string; targetAmount: number; targetDate: Date }) => {
    if (!userId) return;
    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      targetDate: Timestamp.fromDate(data.targetDate),
      priority: "medium",
      createdAt: Timestamp.now(),
    };
    await updateGoals(userId, [...goals, newGoal]);
    setShowForm(false);
  };

  const handleDelete = async (goalId: string) => {
    if (!userId) return;
    setDeleting(goalId);
    await updateGoals(userId, goals.filter(g => g.id !== goalId));
    setDeleting(null);
  };

  const handleLogSavings = async (goalId: string, newAmount: number) => {
    if (!userId) return;
    await updateGoals(userId, goals.map(g =>
      g.id === goalId ? { ...g, currentAmount: Math.min(newAmount, g.targetAmount) } : g
    ));
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  /* Summary stats across all active goals */
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const totalRemaining = activeGoals.reduce((s, g) => s + (g.targetAmount - g.currentAmount), 0);
  const totalDailyNeeded = activeGoals.reduce((s, g) => {
    const stats = calcStats(g);
    return s + (stats.daysLeft > 0 ? stats.adjustedDaily : 0);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-2xl font-bold tracking-tight">Goals</p>
            <p className="text-[#555] text-sm mt-0.5">
              {goals.length === 0 ? "Set a target, save daily" : `${goals.length} goal${goals.length !== 1 ? "s" : ""} · ₹${Math.ceil(totalDailyNeeded).toLocaleString("en-IN")}/day needed`}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#FFFFFF" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* Summary strip (only when there are active goals) */}
        {activeGoals.length > 0 && (
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">Still needed</p>
              <p className="text-white font-bold text-lg">₹{Math.round(totalRemaining).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">Save today</p>
              <p className="text-white font-bold text-lg">₹{Math.ceil(totalDailyNeeded).toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add goal form */}
      {showForm && (
        <AddGoalSheet
          onSave={handleAddGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Goals list */}
      <div className="flex-1 px-5 flex flex-col gap-3">
        {goals.length === 0 && !showForm ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#1A1A1A" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" fill="#444" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">No goals yet</p>
              <p className="text-[#444] text-sm leading-relaxed">
                Set a savings goal with a deadline.<br />Tracksy tells you exactly how much<br />to save every day.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97] transition-all"
              style={{ background: "#fff", color: "#000" }}
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals
            .sort((a, b) => {
              const sa = calcStats(a);
              const sb = calcStats(b);
              // Completed last, then sort by days left ascending
              if (sa.isComplete !== sb.isComplete) return sa.isComplete ? 1 : -1;
              return sa.daysLeft - sb.daysLeft;
            })
            .map(goal => (
              <div
                key={goal.id}
                style={{ opacity: deleting === goal.id ? 0.4 : 1, transition: "opacity 0.2s" }}
              >
                <GoalCard
                  goal={goal}
                  onDelete={handleDelete}
                  onLogSavings={handleLogSavings}
                />
              </div>
            ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
