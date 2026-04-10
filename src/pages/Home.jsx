import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-wallet-dark text-wallet-light font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-wallet-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-wallet-gold">Expert<span className="text-white">Wallet</span></span>
        </div>
        <Link to="/dashboard" className="px-5 py-2 rounded-full bg-wallet-gold text-black text-sm font-semibold hover:bg-yellow-400 transition-colors">
          Open App →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-wallet-gold/30 bg-wallet-gold/10 text-wallet-gold text-xs font-medium tracking-widest uppercase">
          <Zap size={12} /> Your Smart Financial System
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-3xl">
          Money, <span className="text-wallet-gold">managed</span> with precision.
        </h1>
        <p className="text-wallet-muted text-lg max-w-xl">
          Deposit, withdraw, and transfer funds instantly. Track every transaction with full clarity.
        </p>
        <Link to="/dashboard" className="flex items-center gap-2 px-8 py-4 rounded-full bg-wallet-gold text-black font-bold text-base hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
          Get Started <ArrowRight size={18} />
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24 max-w-5xl mx-auto">
        {[
          { icon: <Shield size={24} />, title: "Secure", desc: "Your funds are protected with enterprise-grade security." },
          { icon: <Zap size={24} />, title: "Instant", desc: "Deposits and withdrawals processed in real time." },
          { icon: <TrendingUp size={24} />, title: "Track", desc: "Full transaction history at your fingertips." },
        ].map((f) => (
          <div key={f.title} className="flex flex-col gap-3 p-6 rounded-2xl border border-wallet-border bg-wallet-card hover:border-wallet-gold/40 transition-colors">
            <div className="text-wallet-gold">{f.icon}</div>
            <h3 className="text-white font-semibold text-lg">{f.title}</h3>
            <p className="text-wallet-muted text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}