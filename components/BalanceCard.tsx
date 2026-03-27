"use client";

interface BalanceCardProps {
  income: number;
  expenses: number;
}

export default function BalanceCard({ income, expenses }: BalanceCardProps) {
  const net = income - expenses;

  return (
    <div className="bg-[#132046] rounded-3xl px-6 py-6">
      <p className="text-[#606E79] text-xs font-medium tracking-widest uppercase mb-2">Total Balance</p>
      <p className={`text-[38px] font-bold leading-none mb-6 ${net < 0 ? "text-[#FF5A5F]" : "text-white"}`}>
        {net < 0 ? "−" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
      </p>

      <div className="flex items-center gap-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#01C38D]" />
            <p className="text-[#606E79] text-xs">Income</p>
          </div>
          <p className="text-[#01C38D] font-semibold text-base tabular-nums">
            ₹{income.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="w-px h-8 bg-[#2A3441]" />

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF5A5F]" />
            <p className="text-[#606E79] text-xs">Spent</p>
          </div>
          <p className="text-white font-semibold text-base tabular-nums">
            ₹{expenses.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
