import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-wallet-card border border-wallet-border rounded-xl px-4 py-3 text-sm">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ${p.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      ))}
    </div>
  );
};

export default function MonthlyTrendsChart({ data }) {
  return (
    <div className="bg-wallet-card border border-wallet-border rounded-2xl p-6">
      <h2 className="text-white font-semibold text-base mb-6">Monthly Deposit vs Withdrawal Trends</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#6b6b80", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6b6b80", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,197,24,0.05)" }} />
          <Legend wrapperStyle={{ color: "#6b6b80", fontSize: 12, paddingTop: 16 }} />
          <Bar dataKey="deposit" name="Deposits" fill="#4ade80" radius={[6, 6, 0, 0]} />
          <Bar dataKey="withdraw" name="Withdrawals" fill="#f87171" radius={[6, 6, 0, 0]} />
          <Bar dataKey="transfer" name="Transfers" fill="#60a5fa" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}