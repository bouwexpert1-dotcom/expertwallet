import { TrendingUp, TrendingDown, Activity, Repeat } from "lucide-react";

export default function StatCards({ stats }) {
  const cards = [
    { label: "Total Deposited", value: `$${stats.totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: <TrendingUp size={18} />, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Total Spent/Sent", value: `$${stats.totalWithdrawn.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: <TrendingDown size={18} />, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Net Flow", value: `${stats.netFlow >= 0 ? "+" : ""}$${stats.netFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: <Activity size={18} />, color: stats.netFlow >= 0 ? "text-green-400" : "text-red-400", bg: stats.netFlow >= 0 ? "bg-green-400/10" : "bg-red-400/10" },
    { label: "Transactions", value: stats.txCount, icon: <Repeat size={18} />, color: "text-wallet-gold", bg: "bg-wallet-gold/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="flex flex-col gap-2 p-5 rounded-2xl border border-wallet-border bg-wallet-card">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg} ${c.color}`}>{c.icon}</div>
          <p className="text-wallet-muted text-xs">{c.label}</p>
          <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}