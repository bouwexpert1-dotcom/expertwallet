import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useLanguage();

  const features = [
    { icon: <Shield size={24} />, title: t("features.security"), desc: t("features.securityDesc") },
    { icon: <Zap size={24} />, title: t("features.speed"), desc: t("features.speedDesc") },
    { icon: <TrendingUp size={24} />, title: t("features.tracking"), desc: t("features.trackingDesc") },
  ];

  return (
    <div className="min-h-screen bg-wallet-dark text-wallet-light font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-wallet-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-wallet-gold">Expert<span className="text-white">Wallet</span></span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to="/dashboard" className="px-5 py-2 rounded-full bg-wallet-gold text-black text-sm font-semibold hover:bg-yellow-400 transition-colors">
            {t("goToDashboard")} →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-wallet-gold/30 bg-wallet-gold/10 text-wallet-gold text-xs font-medium tracking-widest uppercase">
          <Zap size={12} /> {t("subheading")}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-3xl">
          {t("expertWallet")}
        </h1>
        <p className="text-wallet-muted text-lg max-w-xl">
          {t("description")}
        </p>
        <Link to="/dashboard" className="flex items-center gap-2 px-8 py-4 rounded-full bg-wallet-gold text-black font-bold text-base hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
          {t("goToDashboard")} <ArrowRight size={18} />
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24 max-w-5xl mx-auto">
        {features.map((f) => (
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