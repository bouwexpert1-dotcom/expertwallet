import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, RotateCw, MailX } from "lucide-react";

const IS_PREVIEW =
  window.self !== window.top || /^preview(-sandbox)?--/.test(window.location.hostname);

export default function Unsubscribe() {
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");

    if (!token) {
      setState(IS_PREVIEW ? "preview" : "invalid");
      return;
    }

    let cancelled = false;
    setState("loading");

    fetch("/api/app-emails/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setState("success");
        else if (res.status === 400) setState("invalid");
        else setState("error");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="min-h-screen bg-wallet-dark flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="https://media.base44.com/images/public/69d91c8f1a7d292748033ae0/9d200eaa5_logo.png"
            alt="ExpertWallet"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-wallet-light text-lg font-bold tracking-tight">ExpertWallet</span>
        </div>

        <div className="bg-wallet-card border border-wallet-border rounded-3xl p-7 md:p-8">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 size={44} className="text-wallet-gold animate-spin" />
              <h1 className="text-wallet-light text-xl font-bold">Procesando tu baja</h1>
              <p className="text-wallet-muted text-sm">Esto toma solo un momento.</p>
            </div>
          )}

          {(state === "success" || state === "preview") && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center">
                <CheckCircle2 size={34} className="text-green-400" />
              </div>

              {state === "preview" && (
                <span className="text-[10px] uppercase tracking-widest text-wallet-gold border border-wallet-gold/40 rounded-full px-2.5 py-0.5">
                  Vista previa
                </span>
              )}

              <h1 className="text-wallet-light text-2xl font-bold">Te diste de baja</h1>
              <p className="text-wallet-muted text-sm leading-relaxed">
                No volverás a recibir correos de marketing de ExpertWallet.
              </p>
              <div className="w-full bg-wallet-dark border border-wallet-border rounded-2xl px-4 py-3 text-left">
                <p className="text-wallet-light text-xs leading-relaxed">
                  Los correos transaccionales, como recibos, avisos de cuenta y
                  restablecimiento de contraseña, seguirán llegando con normalidad.
                </p>
              </div>
            </div>
          )}

          {state === "invalid" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-wallet-gold/10 border border-wallet-gold/30 flex items-center justify-center">
                <MailX size={32} className="text-wallet-gold" />
              </div>
              <h1 className="text-wallet-light text-2xl font-bold">Enlace no válido</h1>
              <p className="text-wallet-muted text-sm leading-relaxed">
                Este enlace de baja no es válido o ya fue utilizado. Si quieres darte de
                baja, abre el enlace del último correo que recibiste.
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h1 className="text-wallet-light text-2xl font-bold">No pudimos completar la baja</h1>
              <p className="text-wallet-muted text-sm leading-relaxed">
                Hubo un problema de conexión. Tu suscripción no cambió.
              </p>
              <button
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-1 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-wallet-gold text-black text-sm font-bold hover:bg-yellow-300 transition-colors"
              >
                <RotateCw size={16} />
                Reintentar
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-wallet-muted text-xs hover:text-wallet-light transition-colors">
            Volver a ExpertWallet
          </Link>
        </p>
      </div>
    </div>
  );
}