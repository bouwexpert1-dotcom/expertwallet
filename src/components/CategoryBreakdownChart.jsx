import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-wallet-card border border-wallet-border rounded-xl px-4 py-3 text-sm">
      <p style={{ color: d.payload.color }} className="font-semibold">{d.name}</p>
      <p className="text-white">${d.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      <p className="text-wallet-muted">{d.payload.percent}% of total</p>
    </div>
  );
};

export default function CategoryBreakdownChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map((d) => ({ ...d, percent: ((d.value / total) * 100).toFixed(1) }));

  return (
    <div className="bg-wallet-card border border-wallet-border rounded-2xl p-6">
      <h2 className="text-white font-semibold text-base mb-6">Transaction Category Breakdown</h2>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={enriched} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
              {enriched.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-3 min-w-max">
          {enriched.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <div>
                <p className="text-white text-sm font-medium">{d.name}</p>
                <p className="text-wallet-muted text-xs">${d.value.toLocaleString("en-US", { minimumFractionDigits: 2 })} · {d.percent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}