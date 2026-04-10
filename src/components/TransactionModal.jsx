import { useState } from "react";
import { X } from "lucide-react";

export default function TransactionModal({ type, walletBalance, onConfirm, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const labels = { deposit: "Deposit", withdraw: "Withdraw", transfer: "Transfer" };

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if ((type === "withdraw" || type === "transfer") && amt > walletBalance) {
      setError("Insufficient balance."); return;
    }
    if (type === "transfer" && !recipient) { setError("Enter recipient email."); return; }
    setLoading(true);
    await onConfirm(type, amt, note, recipient);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 px-4 pb-8 md:pb-0">
      <div className="bg-wallet-card border border-wallet-border rounded-3xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">{labels[type]}</h2>
          <button onClick={onClose} className="text-wallet-muted hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-wallet-gold"
            />
          </div>
          {type === "transfer" && (
            <div>
              <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">Recipient Email</label>
              <input
                type="email"
                placeholder="recipient@email.com"
                value={recipient}
                onChange={(e) => { setRecipient(e.target.value); setError(""); }}
                className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-wallet-gold"
              />
            </div>
          )}
          <div>
            <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">Note (optional)</label>
            <input
              type="text"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-wallet-gold"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-wallet-gold text-black font-bold text-base hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : `Confirm ${labels[type]}`}
          </button>
        </form>
      </div>
    </div>
  );
}