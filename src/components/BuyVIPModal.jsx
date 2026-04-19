import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { WALLET_CONFIG } from "@/lib/walletConfig";

export default function BuyVIPModal({ userEmail, currentBalance, onClose, onSuccess }) {
  const [step, setStep] = useState("confirm"); // confirm | processing | success | error
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  async function handleBuyVIP() {
    if (currentBalance < WALLET_CONFIG.VIP_PRICE_CREDITS) {
      setError(`Necesitas ${WALLET_CONFIG.VIP_PRICE_CREDITS} créditos. Te faltan ${WALLET_CONFIG.VIP_PRICE_CREDITS - currentBalance}.`);
      setStep("error");
      return;
    }

    setStep("processing");
    setError("");

    try {
      const response = await base44.functions.invoke("spendCredits", {
        amount: WALLET_CONFIG.VIP_PRICE_CREDITS,
        type: "VIP",
        return_url: WALLET_CONFIG.ROULETTE_VERIFY_URL
      });

      if (response.data.status === "approved") {
        setToken(response.data.token);
        // Redirigir automáticamente a ruleta sin mostrar token
        setTimeout(() => {
          const verifyUrl = `${WALLET_CONFIG.ROULETTE_VERIFY_URL}?token=${response.data.token}`;
          window.location.href = verifyUrl;
        }, 1500); // Pequeña pausa para UX smooth
      } else if (response.data.status === "insufficient_balance") {
        setError(`Te faltan ${response.data.missing} créditos`);
        setStep("error");
      } else {
        setError("Error al procesar la compra");
        setStep("error");
      }
    } catch (err) {
      setError(err.message || "Error al procesar la compra");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 px-4 pb-8 md:pb-0">
      <div className="bg-wallet-card border border-wallet-border rounded-3xl w-full max-w-md p-6 flex flex-col gap-5">
        
        {/* STEP: Confirm */}
        {step === "confirm" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">Comprar VIP</h2>
              <button onClick={onClose} className="text-wallet-muted hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4 space-y-3">
              <p className="text-wallet-muted text-sm font-semibold">🔓 Desbloquea análisis avanzado</p>
              <ul className="text-sm text-wallet-light space-y-2">
                <li>📊 Predicciones en tiempo real</li>
                <li>⭐ Soporte prioritario</li>
                <li>💎 Acceso exclusivo a datos premium</li>
                <li>🚀 Sin límites de análisis</li>
              </ul>
            </div>

            <div className="flex justify-between items-center bg-wallet-dark rounded-xl p-4">
              <span className="text-wallet-muted">Costo:</span>
              <span className="text-2xl font-bold text-purple-300">{WALLET_CONFIG.VIP_PRICE_CREDITS} créditos</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-wallet-border text-wallet-muted hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBuyVIP}
                className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
              >
                Confirmar Compra
              </button>
            </div>
          </>
        )}

        {/* STEP: Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={48} className="text-purple-400 animate-spin" />
            <p className="text-white font-semibold text-lg">Activando VIP…</p>
            <p className="text-wallet-muted text-sm">Te redirigiremos en un momento</p>
            <div className="w-full bg-wallet-border rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* STEP: Success (Hidden - Auto-redirects) */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 size={56} className="text-green-400" />
            <p className="text-white font-bold text-xl">¡VIP Activado! 🎉</p>
            <p className="text-wallet-muted text-sm text-center">
              Te estamos llevando a la ruleta...
            </p>
            <div className="w-full bg-green-400/10 border border-green-400/30 rounded-xl px-4 py-3 text-xs text-green-300 text-center">
              No cierres esta ventana
            </div>
          </div>
        )}

        {/* STEP: Error */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertCircle size={56} className="text-red-400" />
            <p className="text-white font-bold text-xl">Error en la Compra</p>
            <p className="text-red-300 text-sm text-center">{error}</p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
              >
                Intentar de Nuevo
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-wallet-border text-wallet-muted hover:text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}