"use client";

import { Transaction } from "@/lib/firestore";

const CATEGORY_EMOJI: Record<string, string> = {
  Food: "🍔",
  Travel: "✈️",
  Bills: "📄",
  Lifestyle: "✨",
  Other: "📦",
};

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

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
        {CATEGORY_EMOJI[transaction.category] ?? "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{transaction.category}</p>
        <p className="text-xs text-gray-400">{formattedDate} · {formattedTime}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`font-bold text-base ${
            transaction.type === "income" ? "text-green-500" : "text-red-500"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}₹{transaction.amount.toLocaleString("en-IN")}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
