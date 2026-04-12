import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pencil, Check, X } from "lucide-react";

export default function BudgetProgress({ transactions, userEmail }) {
  const [budget, setBudget] = useState(null);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-04"

  useEffect(() => {
    if (userEmail) loadBudget();
  }, [userEmail]);

  async function loadBudget() {
    const budgets = await base44.entities.Budget.filter({ owner_email: userEmail, month: currentMonth });
    if (budgets[0]) {
      setBudget(budgets[0]);
      setInputValue(String(budgets[0].monthly_limit));
    } else {
      const b = await base44.entities.Budget.create({ owner_email: userEmail, monthly_limit: 1000, month: currentMonth });
      setBudget(b);
      setInputValue("1000");
    }
  }

  async function saveBudget() {
    const val = parseFloat(inputValue);
    if (!val || val <= 0) return;
    const updated = await base44.entities.Budget.update(budget.id, { monthly_limit: val });
    setBudget({ ...budget, monthly_limit: val });
    setEditing(false);
  }

  // Calculate this month's spending (withdrawals + transfers)
  const monthlySpending = transactions
    .filter(tx => {
      const txMonth = tx.created_date?.slice(0, 7);
      return txMonth === currentMonth && (tx.type === "withdraw" || tx.type === "transfer");
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (!budget) return null;

  const limit = budget.monthly_limit;
  const percent = Math.min((monthlySpending / limit) * 100, 100);
  const isOver = monthlySpending > limit;

  const barColor = isOver ? "bg-red-500" : percent > 80 ? "bg-yellow-400" : "bg-wallet-gold";

  return (
    <div className="rounded-2xl bg-wallet-card border border-wallet-border p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-wallet-muted text-xs uppercase tracking-widest">Monthly Budget</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-wallet-muted text-xs">$</span>
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="w-24 bg-wallet-dark border border-wallet-border rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-wallet-gold"
              autoFocus
            />
            <button onClick={saveBudget} className="text-green-400 hover:text-green-300"><Check size={15} /></button>
            <button onClick={() => setEditing(false)} className="text-wallet-muted hover:text-white"><X size={15} /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-wallet-muted hover:text-wallet-gold transition-colors">
            <Pencil size={13} />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className={`text-2xl font-bold ${isOver ? "text-red-400" : "text-white"}`}>
          ${monthlySpending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-wallet-muted text-sm">
          of ${limit.toLocaleString("en-US", { minimumFractionDigits: 2 })} limit
        </span>
      </div>

      <div className="w-full bg-wallet-border rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className={`text-xs font-medium ${isOver ? "text-red-400" : "text-wallet-muted"}`}>
          {isOver ? `⚠️ Over budget by $${(monthlySpending - limit).toFixed(2)}` : `${percent.toFixed(0)}% used`}
        </span>
        <span className="text-xs text-wallet-muted">
          ${Math.max(limit - monthlySpending, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} remaining
        </span>
      </div>
    </div>
  );
}