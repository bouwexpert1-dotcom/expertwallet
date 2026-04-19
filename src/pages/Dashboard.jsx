import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, BarChart2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import TransactionModal from "@/components/TransactionModal";
import BudgetProgress from "@/components/BudgetProgress";
import PayPalDepositModal from "@/components/PayPalDepositModal";
import TransactionList from "@/components/TransactionList";
import WalletCredits from "@/components/WalletCredits";
import BuyVIPModal from "@/components/BuyVIPModal";
import TransactionHistory from "@/components/TransactionHistory";

export default function Dashboard() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [user, setUser] = useState(null);
  const [showVIPModal, setShowVIPModal] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const me = await base44.auth.me();
    setUser(me);
    let wallets = await base44.entities.Wallet.filter({ owner_email: me.email });
    let w = wallets[0];
    if (!w) {
      w = await base44.entities.Wallet.create({ owner_email: me.email, balance: 0, currency: "USD" });
    }
    setWallet(w);
    const txs = await base44.entities.Transaction.filter({ owner_email: me.email }, "-created_date", 50);
    setTransactions(txs);
    setLoading(false);
  }

  async function handleTransaction(type, amount, note, recipientEmail) {
    let newBalance = wallet.balance;
    if (type === "deposit") newBalance += amount;
    else if (type === "withdraw") newBalance -= amount;
    else if (type === "transfer") newBalance -= amount;

    await base44.entities.Wallet.update(wallet.id, { balance: newBalance });
    await base44.entities.Transaction.create({
      wallet_id: wallet.id,
      owner_email: user.email,
      type,
      amount,
      note,
      recipient_email: recipientEmail || "",
    });
    setWallet((w) => ({ ...w, balance: newBalance }));
    const txs = await base44.entities.Transaction.filter({ owner_email: user.email }, "-created_date", 50);
    setTransactions(txs);
    setModal(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-wallet-dark flex items-center justify-center">
        <Loader2 className="text-wallet-gold animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wallet-dark text-white font-sans px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <span className="text-xl font-bold text-wallet-gold">Expert<span className="text-white">Wallet</span></span>
        <div className="flex items-center gap-3">
          <Link to="/analytics" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-wallet-border text-wallet-muted hover:text-wallet-gold hover:border-wallet-gold/40 transition-colors text-xs font-medium">
            <BarChart2 size={13} /> Analytics
          </Link>
          <span className="text-wallet-muted text-sm">{user?.full_name || user?.email}</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-900/10 border border-wallet-gold/30 p-8 mb-8 flex flex-col gap-2">
        <p className="text-wallet-muted text-sm uppercase tracking-widest">Total Balance</p>
        <p className="text-5xl font-extrabold text-white">
          ${wallet.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          <span className="text-wallet-muted text-lg font-normal ml-2">{wallet.currency}</span>
        </p>
      </div>

      {/* Wallet Credits */}
      <WalletCredits userEmail={user?.email} onBuyVIP={() => setShowVIPModal(true)} />

      {/* Actions */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Deposit", icon: <ArrowDownLeft size={20} />, type: "paypal", color: "text-green-400" },
          { label: "Withdraw", icon: <ArrowUpRight size={20} />, type: "withdraw", color: "text-red-400" },
          { label: "Transfer", icon: <ArrowLeftRight size={20} />, type: "transfer", color: "text-blue-400" },
        ].map((a) => (
          <button
            key={a.type}
            onClick={() => setModal(a.type)}
            className="flex flex-col items-center gap-2 py-5 rounded-2xl border border-wallet-border bg-wallet-card hover:border-wallet-gold/40 transition-all"
          >
            <span className={a.color}>{a.icon}</span>
            <span className="text-sm font-medium text-white">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Budget Progress */}
      <BudgetProgress transactions={transactions} userEmail={user?.email} />

      {/* Transactions */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-wallet-muted text-xs uppercase tracking-widest mb-4">Transacciones de Dinero</h3>
          <TransactionList transactions={transactions} />
        </div>
        <div>
          <h3 className="text-wallet-muted text-xs uppercase tracking-widest mb-4">Historial de Créditos</h3>
          <TransactionHistory userEmail={user?.email} />
        </div>
      </div>

      {/* Modals */}
      {modal === "paypal" && (
        <PayPalDepositModal onConfirm={handleTransaction} onClose={() => setModal(null)} />
      )}
      {(modal === "withdraw" || modal === "transfer") && (
        <TransactionModal
          type={modal}
          walletBalance={wallet.balance}
          onConfirm={handleTransaction}
          onClose={() => setModal(null)}
        />
      )}
      {showVIPModal && (
        <BuyVIPModal
          userEmail={user?.email}
          currentBalance={wallet.balance}
          onClose={() => setShowVIPModal(false)}
        />
      )}
    </div>
  );
}