import { useState } from "react";
import { X, CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function PayPalDepositModal({ onConfirm, onClose }) {
  const [step, setStep] = useState("amount"); // amount | processing | success | failed
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleAmountSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { setError("Minimum deposit is $1.00"); return; }
    if (!email) { setError("Enter your PayPal email."); return; }
    setError("");
    setStep("processing");
    // Simulate PayPal processing delay
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate simulation
      setStep(success ? "success" : "failed");
    }, 2500);
  }

  async function handleSuccess() {
    await onConfirm("deposit", parseFloat(amount), `PayPal deposit from ${email}`, "");
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 px-4 pb-8 md:pb-0">
      <div className="bg-wallet-card border border-wallet-border rounded-3xl w-full max-w-md p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center">
              <span className="text-white font-bold text-xs">PP</span>
            </div>
            <h2 className="text-white text-xl font-bold">PayPal Deposit</h2>
          </div>
          {step !== "processing" && (
            <button onClick={onClose} className="text-wallet-muted hover:text-white"><X size={20} /></button>
          )}
        </div>

        {/* STEP: Amount */}
        {step === "amount" && (
          <form onSubmit={handleAmountSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-wallet-muted text-xs uppercase tracking-widest mb-2 block">Select Amount</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmount(String(a)); setError(""); }}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      amount === String(a)
                        ? "border-wallet-gold bg-wallet-gold/10 text-wallet-gold"
                        : "border-wallet-border text-wallet-muted hover:border-wallet-gold/40 hover:text-white"
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Or enter custom amount..."
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-wallet-gold"
              />
            </div>
            <div>
              <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">PayPal Email</label>
              <input
                type="email"
                placeholder="your@paypal.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-wallet-gold"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="bg-[#003087]/20 border border-[#003087]/40 rounded-xl px-4 py-3 text-xs text-blue-300">
              🔒 Demo mode — no real charges. Connect PayPal credentials for live payments.
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0070ba] text-white font-bold text-base hover:bg-[#005ea6] transition-colors"
            >
              Pay with PayPal {amount ? `— $${parseFloat(amount || 0).toFixed(2)}` : ""}
            </button>
          </form>
        )}

        {/* STEP: Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={48} className="text-[#0070ba] animate-spin" />
            <p className="text-white font-semibold text-lg">Processing Payment...</p>
            <p className="text-wallet-muted text-sm">Connecting to PayPal securely</p>
            <div className="w-full bg-wallet-border rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-[#0070ba] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* STEP: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 size={56} className="text-green-400" />
            <p className="text-white font-bold text-xl">Payment Successful!</p>
            <p className="text-wallet-muted text-sm">
              <span className="text-wallet-gold font-semibold">${parseFloat(amount).toFixed(2)}</span> will be added to your wallet
            </p>
            <div className="w-full bg-green-400/10 border border-green-400/30 rounded-xl px-4 py-3 text-xs text-green-300 text-center">
              Transaction ID: PP-{Date.now().toString().slice(-10).toUpperCase()}
            </div>
            <button
              onClick={handleSuccess}
              className="w-full py-3 rounded-xl bg-wallet-gold text-black font-bold text-base hover:bg-yellow-400 transition-colors"
            >
              Add to Wallet
            </button>
          </div>
        )}

        {/* STEP: Failed */}
        {step === "failed" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertCircle size={56} className="text-red-400" />
            <p className="text-white font-bold text-xl">Payment Failed</p>
            <p className="text-wallet-muted text-sm text-center">Your PayPal payment could not be processed. Please try again.</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep("amount")}
                className="flex-1 py-3 rounded-xl bg-wallet-gold text-black font-bold hover:bg-yellow-400 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-wallet-border text-wallet-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}