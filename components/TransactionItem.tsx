"use client";

import { Transaction, ALL_CATEGORY_EMOJI } from "@/lib/firestore";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const date = transaction.createdAt?.toDate?.();
  const formattedDate = date
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "";
  const formattedTime = date
    ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
        isIncome ? "bg-emerald-50" : "bg-red-50"
      }`}>
        {ALL_CATEGORY_EMOJI[transaction.category] ?? "📦"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{transaction.category}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formattedDate} · {formattedTime}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`font-bold text-base tabular-nums ${isIncome ? "text-emerald-500" : "text-red-500"}`}>
          {isIncome ? "+" : "−"}₹{transaction.amount.toLocaleString("en-IN")}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 active:text-red-400 active:bg-red-50 transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
