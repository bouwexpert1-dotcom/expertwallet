import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Coins, Loader2 } from "lucide-react";

export default function WalletCredits({ userEmail, onBuyVIP }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) loadBalance();
  }, [userEmail]);

  async function loadBalance() {
    try {
      const wallets = await base44.entities.WalletBalance.filter({ user_id: userEmail });
      if (wallets[0]) {
        setBalance(wallets[0].balance);
      } else {
        // Crear wallet si no existe
        const w = await base44.entities.WalletBalance.create({ user_id: userEmail, balance: 100 });
        setBalance(w.balance);
      }
    } catch (error) {
      console.error("Error loading balance:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-wallet-card border border-wallet-border p-5 flex items-center justify-center gap-2 text-wallet-muted">
        <Loader2 size={16} className="animate-spin" /> Cargando créditos...
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-900/10 border border-purple-400/30 p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
          <Coins className="text-purple-300" size={24} />
        </div>
        <div>
          <p className="text-wallet-muted text-xs uppercase tracking-widest">Tus Créditos</p>
          <p className="text-3xl font-bold text-white">{balance}</p>
        </div>
      </div>
      <button
        onClick={onBuyVIP}
        className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors text-sm"
      >
        Comprar VIP
      </button>
    </div>
  );
}