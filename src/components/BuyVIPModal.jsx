import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const VIP_COST = 50;

export default function BuyVIPModal({ userEmail, currentBalance, onClose, onSuccess }) {
  const [step, setStep] = useState("confirm"); // confirm | processing | success | error
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  async function handleBuyVIP() {
    if (currentBalance < VIP_COST) {
      setError(`Necesitas ${VIP_COST} créditos. Te faltan ${VIP_COST - currentBalance}.`);
      setStep("error");
      return;
    }

    setStep("processing");
    setError("");

    try {
      const response = await base44.functions.invoke("spendCredits", {
        amount: VIP_COST,
        type: "VIP"
      });

      if (response.data.success) {
        setToken(response.data.token);
        setStep("success");
        // Aquí irías a la app de ruleta con el token
        // window.location.href = `https://ruleta-app.com?token=${response.data.token}`;
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
              <div className="flex justify-between items-center">
                <span className="text-wallet-muted">Beneficios VIP:</span>
              </div>
              <ul className="text-sm text-wallet-light space-y-2">
                <li>✨ Acceso a ruleta premium</li>
                <li>💎 Multiplicadores aumentados</li>
                <li>🎁 Bonificaciones diarias</li>
                <li>👑 Badge exclusivo</li>
              </ul>
            </div>

            <div className="flex justify-between items-center bg-wallet-dark rounded-xl p-4">
              <span className="text-wallet-muted">Costo:</span>
              <span className="text-2xl font-bold text-purple-300">{VIP_COST} créditos</span>
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
            <p className="text-white font-semibold text-lg">Procesando compra...</p>
            <p className="text-wallet-muted text-sm">Por favor espera</p>
          </div>
        )}

        {/* STEP: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 size={56} className="text-green-400" />
            <p className="text-white font-bold text-xl">¡Compra Exitosa!</p>
            <p className="text-wallet-muted text-sm text-center">
              Ahora tienes acceso a VIP. Tu token de verificación es válido por 60 segundos.
            </p>
            
            <div className="w-full bg-wallet-dark border border-wallet-border rounded-xl p-4 text-xs font-mono text-wallet-muted break-all max-h-24 overflow-auto">
              {token}
            </div>

            <p className="text-xs text-wallet-muted text-center">
              Serás redirigido a la app de ruleta automáticamente
            </p>

            <button
              onClick={() => {
                // Aquí irías a la app de ruleta
                window.location.href = `https://ruleta-app.com?token=${token}`;
              }}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors"
            >
              Ir a Ruleta VIP
            </button>
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