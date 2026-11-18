import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Coins, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const RULE_NOTE =
  "Los créditos solo pueden usarse dentro de la plataforma (SpinAtlas, Easy Win). No se convierten en dinero real ni se pueden retirar a una cuenta bancaria.";

export default function TransferCreditsModal({ onClose, onDone }) {
  const [step, setStep] = useState("form"); // form | processing | success | error
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const credits = parseFloat(amount);

    if (!email.trim() || !email.includes("@")) {
      setError("Introduce el email del destinatario.");
      return;
    }
    if (!credits || credits <= 0) {
      setError("Introduce una cantidad de créditos mayor que 0.");
      return;
    }

    setError("");
    setStep("processing");

    try {
      const response = await base44.functions.invoke("transferCredits", {
        recipient_email: email.trim().toLowerCase(),
        amount: credits,
        note: note.trim(),
        idempotency_key: crypto.randomUUID(),
      });

      const data = response.data || {};
      if (data.status === "completed") {
        setResult(data);
        setStep("success");
        onDone?.(data.balance);
      } else {
        setError(data.error || "No se pudo completar la transferencia.");
        setStep("error");
      }
    } catch (err) {
      const data = err?.response?.data || {};
      if (data.status === "insufficient_balance") {
        setError(`Te faltan ${data.missing} créditos. Tu saldo es ${data.balance}.`);
      } else {
        setError(data.error || err.message || "No se pudo completar la transferencia.");
      }
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 px-4 pb-8 md:pb-0">
      <div className="bg-wallet-card border border-wallet-border rounded-3xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={20} className="text-purple-300" />
            <h2 className="text-white text-xl font-bold">Transferir créditos</h2>
          </div>
          {step !== "processing" && (
            <button onClick={onClose} className="text-wallet-muted hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">
                Email del destinatario
              </label>
              <input
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">
                Créditos a enviar
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-wallet-muted text-xs uppercase tracking-widest mb-1 block">
                Nota (opcional)
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="Motivo de la transferencia"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <p className="text-[11px] leading-relaxed text-wallet-muted bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3">
              {RULE_NOTE}
            </p>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              Enviar créditos
            </button>
          </form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={48} className="text-purple-400 animate-spin" />
            <p className="text-white font-semibold text-lg">Moviendo créditos...</p>
            <p className="text-wallet-muted text-sm">No cierres esta ventana.</p>
          </div>
        )}

        {step === "success" && result && (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 size={56} className="text-green-400" />
            <p className="text-white font-bold text-xl">Transferencia completada</p>
            <p className="text-wallet-muted text-sm text-center">
              Enviaste <span className="text-purple-300 font-semibold">{result.credits} créditos</span> a{" "}
              <span className="text-white">{result.recipient?.email || email}</span>
            </p>
            <div className="w-full bg-wallet-dark border border-wallet-border rounded-xl px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-wallet-muted">Tu saldo</span>
                <span className="text-white font-semibold">{result.balance} créditos</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-wallet-muted">Referencia</span>
                <span className="text-wallet-muted">{result.reference}</span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-wallet-muted text-center">{RULE_NOTE}</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircle size={56} className="text-red-400" />
            <p className="text-white font-bold text-xl">No se pudo transferir</p>
            <p className="text-red-300 text-sm text-center">{error}</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep("form")}
                className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-wallet-border text-wallet-muted hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}