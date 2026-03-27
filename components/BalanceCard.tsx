"use client";

interface BalanceCardProps {
  income: number;
  expenses: number;
}

export default function BalanceCard({ income, expenses }: BalanceCardProps) {
  const net = income - expenses;
  const isPositive = net >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6"
      style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #132046 60%, #1A2A52 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{
          background: isPositive ? "rgba(1,195,141,0.18)" : "rgba(255,90,95,0.18)",
          top: "-30%",
          right: "-10%",
        }}
      />

      <p className="text-[#7A8EA0] text-[11px] font-semibold tracking-widest uppercase mb-3">Total Balance</p>
      <p
        className="text-[44px] font-bold leading-none mb-6 tracking-tight"
        style={{ color: isPositive ? "#fff" : "#FF5A5F" }}
      >
        {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: "rgba(1,195,141,0.12)" }}>
          <p className="text-[#01C38D] text-[10px] font-bold tracking-widest uppercase mb-1">Income</p>
          <p className="text-white font-bold text-base tabular-nums">₹{income.toLocaleString("en-IN")}</p>
        </div>
        <div className="flex-1 rounded-2xl px-4 py-3" style={{ background: "rgba(255,90,95,0.1)" }}>
          <p className="text-[#FF5A5F] text-[10px] font-bold tracking-widest uppercase mb-1">Spent</p>
          <p className="text-white font-bold text-base tabular-nums">₹{expenses.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}
