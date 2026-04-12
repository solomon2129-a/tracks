"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";

/* ─── Types ─── */
export interface Due {
  id: string;
  personName: string;
  amount: number;
  type: "i_owe" | "they_owe";   // i_owe = red, they_owe = green
  note: string;
  createdAtMs: number;
  settledAtMs: number | null;
}

/* ─── localStorage ─── */
function duesKey(userId: string) { return `tracksy_dues_${userId}`; }
function loadDues(userId: string): Due[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(duesKey(userId));
    return raw ? (JSON.parse(raw) as Due[]) : [];
  } catch { return []; }
}
function persistDues(userId: string, dues: Due[]) {
  localStorage.setItem(duesKey(userId), JSON.stringify(dues));
}

/* ─── Add Due Form ─── */
function AddDueForm({ onSave, onCancel }: {
  onSave: (d: Omit<Due, "id" | "createdAtMs" | "settledAtMs">) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<"i_owe" | "they_owe">("i_owe");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const canSubmit = person.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <div className="modal-enter mx-5 mb-4 rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
      <p className="text-white font-bold text-base mb-4">New Entry</p>

      {/* Type toggle */}
      <div
        className="flex rounded-xl p-1 mb-4"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => setType("i_owe")}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            background: type === "i_owe" ? "rgba(244,63,94,0.15)" : "transparent",
            color: type === "i_owe" ? "#F43F5E" : "#555",
            border: type === "i_owe" ? "1px solid rgba(244,63,94,0.25)" : "1px solid transparent",
          }}
        >
          I Owe
        </button>
        <button
          onClick={() => setType("they_owe")}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            background: type === "they_owe" ? "rgba(34,197,94,0.12)" : "transparent",
            color: type === "they_owe" ? "#22C55E" : "#555",
            border: type === "they_owe" ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
          }}
        >
          They Owe Me
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">
            {type === "i_owe" ? "Who do you owe?" : "Who owes you?"}
          </p>
          <input
            type="text"
            placeholder="Name"
            value={person}
            onChange={e => setPerson(e.target.value)}
            autoFocus
            className="w-full rounded-xl px-4 py-3.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        <div>
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Amount (₹)</p>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        <div>
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Note (optional)</p>
          <input
            type="text"
            placeholder="e.g. Dinner, movie tickets…"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-white text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.97]"
            style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
          >
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onSave({ type, personName: person.trim(), amount: parseFloat(amount), note: note.trim() })}
            disabled={!canSubmit}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm active:scale-[0.97] transition-all"
            style={{
              background: canSubmit ? "#fff" : "rgba(255,255,255,0.07)",
              color: canSubmit ? "#000" : "#444",
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Due Card ─── */
function DueCard({ due, onSettle, onDelete }: {
  due: Due;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isOwed = due.type === "they_owe";
  const color = isOwed ? "#22C55E" : "#F43F5E";
  const bgColor = isOwed ? "rgba(34,197,94,0.07)" : "rgba(244,63,94,0.07)";
  const borderColor = isOwed ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)";
  const settled = due.settledAtMs !== null;
  const date = new Date(due.createdAtMs).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: settled ? "rgba(255,255,255,0.03)" : bgColor,
        border: `1px solid ${settled ? "rgba(255,255,255,0.06)" : borderColor}`,
        opacity: settled ? 0.55 : 1,
        boxShadow: settled ? "none" : isOwed
          ? "0 0 16px rgba(34,197,94,0.12), 0 0 40px rgba(34,197,94,0.05)"
          : "0 0 16px rgba(244,63,94,0.12), 0 0 40px rgba(244,63,94,0.05)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
        style={{ background: settled ? "rgba(255,255,255,0.06)" : (isOwed ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)"), color: settled ? "#444" : color }}
      >
        {due.personName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white font-bold text-sm truncate">{due.personName}</p>
          {settled && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", color: "#555" }}>
              Settled
            </span>
          )}
        </div>
        <p className="text-[#555] text-xs truncate">{due.note || (isOwed ? "You owe them" : "They owe you")} · {date}</p>
      </div>

      {/* Amount + actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <p className="font-bold text-base" style={{ color: settled ? "#444" : color }}>
          {isOwed ? "-" : "+"}₹{due.amount.toLocaleString("en-IN")}
        </p>
        {!settled ? (
          <button
            onClick={() => onSettle(due.id)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.07)", color: "#888" }}
          >
            Settle
          </button>
        ) : (
          <button
            onClick={() => onDelete(due.id)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg active:scale-90 transition-transform"
            style={{ background: "rgba(244,63,94,0.08)", color: "#F43F5E" }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function DuesPage() {
  const { userId, loading } = useAuth();
  const [dues, setDues] = useState<Due[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"active" | "settled">("active");

  useEffect(() => {
    if (!userId) return;
    setDues(loadDues(userId));
  }, [userId]);

  const save = useCallback((updated: Due[]) => {
    setDues(updated);
    if (userId) persistDues(userId, updated);
  }, [userId]);

  const handleAdd = (data: Omit<Due, "id" | "createdAtMs" | "settledAtMs">) => {
    const newDue: Due = { ...data, id: `due_${Date.now()}`, createdAtMs: Date.now(), settledAtMs: null };
    save([newDue, ...dues]);
    setShowForm(false);
  };

  const handleSettle = (id: string) => {
    save(dues.map(d => d.id === id ? { ...d, settledAtMs: Date.now() } : d));
  };

  const handleDelete = (id: string) => {
    save(dues.filter(d => d.id !== id));
  };

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const active = dues.filter(d => d.settledAtMs === null);
  const settled = dues.filter(d => d.settledAtMs !== null);

  const totalIOwe    = active.filter(d => d.type === "i_owe").reduce((s, d) => s + d.amount, 0);
  const totalOwedMe  = active.filter(d => d.type === "they_owe").reduce((s, d) => s + d.amount, 0);
  const net = totalOwedMe - totalIOwe;

  const list = tab === "active" ? active : settled;

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: "#0F0F0F" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-2xl font-bold tracking-tight">Dues</p>
            <p className="text-[#555] text-sm mt-0.5">
              {active.length === 0 ? "All clear" : `${active.length} pending`}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#fff" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* Summary */}
        {dues.length > 0 && (
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">I Owe</p>
              <p className="font-bold text-lg" style={{ color: totalIOwe > 0 ? "#F43F5E" : "#444" }}>
                ₹{totalIOwe.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">Owed to Me</p>
              <p className="font-bold text-lg" style={{ color: totalOwedMe > 0 ? "#22C55E" : "#444" }}>
                ₹{totalOwedMe.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex-1 rounded-2xl p-4" style={{ background: "#1A1A1A" }}>
              <p className="text-[#555] text-[9px] font-semibold tracking-widest uppercase mb-1">Net</p>
              <p className="font-bold text-lg" style={{ color: net > 0 ? "#22C55E" : net < 0 ? "#F43F5E" : "#444" }}>
                {net >= 0 ? "+" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && <AddDueForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}

      {/* Tab switcher */}
      {settled.length > 0 && (
        <div className="px-5 mb-3 flex gap-2">
          {(["active", "settled"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: tab === t ? "#fff" : "rgba(255,255,255,0.06)",
                color: tab === t ? "#000" : "#555",
              }}
            >
              {t === "active" ? `Active (${active.length})` : `Settled (${settled.length})`}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 px-5 flex flex-col gap-3">
        {dues.length === 0 && !showForm ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#1A1A1A" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2v4l.586-.586" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-1">No dues logged</p>
              <p className="text-[#444] text-sm leading-relaxed">
                Track who owes you and<br />who you need to pay back.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm active:scale-[0.97]"
              style={{ background: "#fff", color: "#000" }}
            >
              Add First Entry
            </button>
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-[#444] text-sm py-12">No {tab} entries</p>
        ) : (
          list.map(due => (
            <DueCard key={due.id} due={due} onSettle={handleSettle} onDelete={handleDelete} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
