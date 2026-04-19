import { useLanguage } from "@/lib/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-wallet-muted" />
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-wallet-dark border border-wallet-border rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer hover:border-wallet-gold/40 transition-colors focus:outline-none focus:border-wallet-gold"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
    </div>
  );
}