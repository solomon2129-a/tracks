"use client";

import CategoryIcon from "./CategoryIcon";

interface BreakdownListProps {
  categoryTotals: Record<string, number>;
  totalExpenses: number;
}

export default function BreakdownList({ categoryTotals, totalExpenses }: BreakdownListProps) {
  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl px-5 py-4" style={{ background: "#1A1A1A" }}>
      <p className="text-[#666] text-[11px] font-semibold tracking-widest uppercase mb-4">Top Spending</p>
      <div className="flex flex-col gap-4">
        {sorted.map(([cat, total]) => {
          const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <CategoryIcon category={cat} size={13} color="#FFFFFF" strokeWidth={2} />
                  <span className="text-white text-sm">{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#555] text-xs tabular-nums">{pct.toFixed(0)}%</span>
                  <span className="text-white text-sm font-bold tabular-nums">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: "#FFFFFF" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
