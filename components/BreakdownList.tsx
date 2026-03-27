"use client";

import CategoryIcon, { getCategoryColor } from "./CategoryIcon";

interface BreakdownListProps {
  categoryTotals: Record<string, number>;
  totalExpenses: number;
}

export default function BreakdownList({ categoryTotals, totalExpenses }: BreakdownListProps) {
  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);

  if (sorted.length === 0) return null;

  return (
    <div className="bg-[#132046] rounded-3xl px-5 py-5">
      <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase mb-4">Top Spending</p>
      <div className="flex flex-col gap-4">
        {sorted.map(([cat, total], i) => {
          const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
          const color = getCategoryColor(cat);
          return (
            <div key={cat} className="fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22` }}
                  >
                    <CategoryIcon category={cat} size={13} color={color} strokeWidth={2} />
                  </div>
                  <span className="text-white text-sm font-medium">{cat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#7A8EA0] text-xs tabular-nums">{pct.toFixed(0)}%</span>
                  <span className="text-white text-sm font-bold tabular-nums">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
