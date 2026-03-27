"use client";

interface BalanceCardProps {
  income: number;
  expenses: number;
}

export default function BalanceCard({ income, expenses }: BalanceCardProps) {
  const net = income - expenses;
  const isPositive = net >= 0;

  return (
    <div className="rounded-2xl p-5" style={{ background: "#1A1A1A" }}>
      <p className="text-[#666] text-[11px] font-semibold tracking-widest uppercase mb-2">Net Balance</p>
      <p
        className="text-[42px] font-bold leading-none mb-5 tracking-tight"
        style={{ color: isPositive ? "#FFFFFF" : "#F43F5E" }}
      >
        {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
      </p>
      <div className="flex gap-2">
        <div
          className="flex-1 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[#666] text-[10px] font-semibold tracking-widest uppercase mb-1">Income</p>
          <p className="text-[#22C55E] font-bold text-sm tabular-nums">₹{income.toLocaleString("en-IN")}</p>
        </div>
        <div
          className="flex-1 rounded-xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[#666] text-[10px] font-semibold tracking-widest uppercase mb-1">Spent</p>
          <p className="text-white font-bold text-sm tabular-nums">₹{expenses.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}
