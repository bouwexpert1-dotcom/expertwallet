import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/LanguageContext";

const config = {
  deposit: { icon: <ArrowDownLeft size={16} />, color: "text-green-400", bg: "bg-green-400/10", sign: "+" },
  withdraw: { icon: <ArrowUpRight size={16} />, color: "text-red-400", bg: "bg-red-400/10", sign: "-" },
  transfer: { icon: <ArrowLeftRight size={16} />, color: "text-blue-400", bg: "bg-blue-400/10", sign: "-" },
};

export default function TransactionList({ transactions }) {
  const { t } = useLanguage();
  
  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-wallet-muted text-sm">
        {t('noTransactions')}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-wallet-muted text-xs uppercase tracking-widest mb-1">{t('recentTransactions')}</h3>
      {transactions.map((tx) => {
        const c = config[tx.type] || config.deposit;
        const typeLabel = t(`transactionType.${tx.type}`) || tx.type;
        return (
          <div key={tx.id} className="flex items-center gap-4 p-4 rounded-2xl bg-wallet-card border border-wallet-border">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${c.bg} ${c.color} shrink-0`}>
              {c.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium capitalize">{typeLabel}{tx.recipient_email ? ` → ${tx.recipient_email}` : ""}</p>
              {tx.note && <p className="text-wallet-muted text-xs truncate">{tx.note}</p>}
              <p className="text-wallet-muted text-xs">{format(new Date(tx.created_date), "MMM d, yyyy · h:mm a")}</p>
            </div>
            <p className={`text-base font-bold ${c.color} shrink-0`}>
              {c.sign}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        );
      })}
    </div>
  );
}