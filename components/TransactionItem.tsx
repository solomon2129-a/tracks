"use client";

import { useState } from "react";
import { Transaction } from "@/lib/firestore";
import CategoryIcon from "./CategoryIcon";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const [confirming, setConfirming] = useState(false);
  const date = transaction.createdAt?.toDate?.();
  const now = new Date();
  const isToday = date && date.toDateString() === now.toDateString();
  const label = isToday
    ? `Today · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : date
    ? `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : "";

  const isIncome = transaction.type === "income";

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2000);
      return;
    }
    onDelete?.(transaction.id);
  };

  return (
    <div className="flex items-center gap-3 py-3.5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <CategoryIcon category={transaction.category} size={16} color="#FFFFFF" strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{transaction.category}</p>
        <p className="text-[#555] text-xs mt-0.5">{label}</p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="font-bold text-sm tabular-nums"
          style={{ color: isIncome ? "#22C55E" : "#FFFFFF" }}
        >
          {isIncome ? "+" : "−"}₹{transaction.amount.toLocaleString("en-IN")}
        </span>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{
              background: confirming ? "rgba(244,63,94,0.15)" : "transparent",
              color: confirming ? "#F43F5E" : "#444",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
