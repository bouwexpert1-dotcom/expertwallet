import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import MonthlyTrendsChart from "@/components/MonthlyTrendsChart";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import StatCards from "@/components/StatCards";
import { processTransactions } from "@/lib/analyticsUtils";

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
      const txs = await base44.entities.Transaction.filter({ owner_email: me.email }, "-created_date", 200);
      setTransactions(txs);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-wallet-dark flex items-center justify-center">
        <Loader2 className="text-wallet-gold animate-spin" size={32} />
      </div>
    );
  }

  const { monthlyData, categoryData, stats } = processTransactions(transactions);

  return (
    <div className="min-h-screen bg-wallet-dark text-white font-sans px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-wallet-muted hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart2 size={22} className="text-wallet-gold" />
            <h1 className="text-xl font-bold">Analytics</h1>
          </div>
        </div>
        <span className="text-wallet-muted text-sm">{user?.full_name || user?.email}</span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-wallet-muted">
          <BarChart2 size={48} className="opacity-30" />
          <p className="text-lg font-medium">No transactions yet</p>
          <p className="text-sm">Make your first deposit to see analytics here.</p>
          <Link to="/dashboard" className="mt-2 px-5 py-2 rounded-full bg-wallet-gold text-black text-sm font-semibold hover:bg-yellow-400 transition-colors">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <StatCards stats={stats} />
          <MonthlyTrendsChart data={monthlyData} />
          <CategoryBreakdownChart data={categoryData} />
        </div>
      )}
    </div>
  );
}