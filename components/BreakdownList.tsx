"use client";

import CategoryIcon from "./CategoryIcon";

interface BreakdownListProps {
  categoryTotals: Record<string, number>;
  totalExpenses: number;
}

export default function BreakdownList({ categoryTotals, totalExpenses }: BreakdownListProps) {
  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return null;

  return (
    <div className="bg-[#132046] rounded-3xl px-5 py-5">
      <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase mb-4">Spending</p>
      <div className="flex flex-col gap-4 stagger-children">
        {sorted.map(([cat, total]) => {
          const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
          return (
            <div key={cat} className="fade-up">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <CategoryIcon category={cat} size={15} color="#606E79" strokeWidth={1.8} />
                  <span className="text-white text-sm font-medium">{cat}</span>
                </div>
                <span className="text-white text-sm font-semibold tabular-nums">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-0.5 bg-[#2A3441] rounded-full">
                <div
                  className="h-full bg-[#01C38D] rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
