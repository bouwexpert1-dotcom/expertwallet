import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { FlaskConical, Loader2, ShieldAlert, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

function ResultCard({ title, expected, result }) {
  const ok = result?.status === expected;
  const Icon = ok ? CheckCircle2 : XCircle;

  return (
    <div className="rounded-2xl border border-wallet-border bg-wallet-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm">{title}</p>
        <span
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
            ok ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
          }`}
        >
          <Icon size={13} />
          HTTP {result?.status ?? "—"}
        </span>
      </div>
      <p className="text-wallet-muted text-xs">
        Esperado: {expected} {ok ? "· correcto" : "· revisar"}
      </p>
      <pre className="bg-wallet-dark rounded-xl p-3 text-[11px] text-wallet-light overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(result?.body ?? null, null, 2)}
      </pre>
    </div>
  );
}

export default function AdminDepositTest() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  async function runTest() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const response = await base44.functions.invoke("testDepositSignature", {});
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "No se pudo ejecutar la prueba");
    } finally {
      setRunning(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-wallet-dark flex items-center justify-center">
        <Loader2 className="text-wallet-gold animate-spin" size={32} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-wallet-dark flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <ShieldAlert className="text-red-400 mx-auto" size={40} />
          <h1 className="text-white text-xl font-bold">Acceso restringido</h1>
          <p className="text-wallet-muted text-sm">Esta página solo está disponible para administradores.</p>
          <Link to="/" className="inline-block text-wallet-gold text-sm font-semibold hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wallet-dark text-white px-4 py-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-wallet-muted hover:text-white text-xs font-medium">
          <ArrowLeft size={14} /> Volver
        </Link>
        <span className="text-[11px] uppercase tracking-widest text-wallet-muted">Solo administradores</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical size={22} className="text-wallet-gold" /> Prueba del endpoint de depósito
        </h1>
        <p className="text-wallet-muted text-sm mt-2">
          Se genera una llamada firmada (HMAC) con datos de prueba al endpoint de depósitos confirmados. Se ejecutan
          dos intentos: uno con la firma alterada y otro con la firma correcta.
        </p>
      </div>

      <div className="rounded-2xl border border-wallet-gold/30 bg-wallet-gold/5 p-4 text-xs text-wallet-light leading-relaxed">
        El intento con firma correcta acredita <span className="font-bold text-wallet-gold">1 crédito de prueba</span> a
        tu propia cuenta y dispara el envío del recibo por correo. Aparecerá en tu historial con la referencia
        TEST-…
      </div>

      <button
        onClick={runTest}
        disabled={running}
        className="w-full py-3 rounded-xl bg-wallet-gold text-black font-bold hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Ejecutando prueba…
          </>
        ) : (
          <>
            <FlaskConical size={16} /> Ejecutar prueba firmada
          </>
        )}
      </button>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {result && (
        <div className="space-y-4">
          <ResultCard
            title="Firma inválida"
            expected={401}
            result={result.invalidSignature}
          />
          <ResultCard
            title="Firma válida"
            expected={200}
            result={result.validSignature}
          />
          <p className="text-[11px] text-wallet-muted break-all">Endpoint: {result.endpoint}</p>
        </div>
      )}
    </div>
  );
}