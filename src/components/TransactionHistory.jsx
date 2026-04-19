import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, Gift } from "lucide-react";

const typeConfig = {
  spend: { icon: <ArrowUp size={16} />, color: "text-red-400", bg: "bg-red-400/10", label: "Gasto" },
  deposit: { icon: <ArrowDown size={16} />, color: "text-green-400", bg: "bg-green-400/10", label: "Depósito" },
  reward: { icon: <Gift size={16} />, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Recompensa" },
};

export default function TransactionHistory({ userEmail }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) loadTransactions();
  }, [userEmail]);

  async function loadTransactions() {
    try {
      const txs = await base44.entities.WalletTransaction.filter(
        { user_id: userEmail },
        "-created_date",
        10
      );
      setTransactions(txs);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-wallet-muted text-sm">Cargando historial...</div>;
  if (!transactions.length) return <div className="text-wallet-muted text-sm">Sin movimientos</div>;

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type] || typeConfig.deposit;
        const sign = tx.type === "spend" ? "-" : "+";
        
        return (
          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-wallet-card border border-wallet-border/50">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{config.label}</p>
              <p className="text-wallet-muted text-xs">
                {format(new Date(tx.created_date), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
            <p className={`text-sm font-bold ${config.color}`}>
              {sign}{tx.amount}
            </p>
          </div>
        );
      })}
    </div>
  );
}