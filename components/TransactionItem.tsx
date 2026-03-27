"use client";

import { Transaction } from "@/lib/firestore";
import CategoryIcon from "./CategoryIcon";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const date = transaction.createdAt?.toDate?.();
  const now = new Date();
  const isToday = date && date.toDateString() === now.toDateString();
  const label = isToday
    ? `Today · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : date
    ? `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
    : "";

  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-2xl bg-[#191E29] flex items-center justify-center flex-shrink-0">
        <CategoryIcon
          category={transaction.category}
          size={16}
          color={isIncome ? "#01C38D" : "#606E79"}
          strokeWidth={1.8}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{transaction.category}</p>
        <p className="text-[#606E79] text-xs mt-0.5">{label}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`font-semibold text-sm tabular-nums ${isIncome ? "text-[#01C38D]" : "text-white"}`}>
          {isIncome ? "+" : "−"}₹{transaction.amount.toLocaleString("en-IN")}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="w-6 h-6 flex items-center justify-center text-[#2A3441] active:text-[#FF5A5F] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
