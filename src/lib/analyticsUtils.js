import { format, parseISO, startOfMonth } from "date-fns";

export function processTransactions(transactions) {
  // Monthly data
  const monthlyMap = {};
  transactions.forEach((tx) => {
    const month = format(startOfMonth(new Date(tx.created_date)), "MMM yyyy");
    if (!monthlyMap[month]) monthlyMap[month] = { month, deposit: 0, withdraw: 0, transfer: 0 };
    monthlyMap[month][tx.type] = (monthlyMap[month][tx.type] || 0) + tx.amount;
  });

  // Sort months ascending
  const monthlyData = Object.values(monthlyMap).reverse().slice(0, 6).reverse();

  // Category breakdown (by type)
  const catMap = { deposit: 0, withdraw: 0, transfer: 0 };
  transactions.forEach((tx) => { catMap[tx.type] = (catMap[tx.type] || 0) + tx.amount; });
  const categoryData = [
    { name: "Deposits", value: catMap.deposit, color: "#4ade80" },
    { name: "Withdrawals", value: catMap.withdraw, color: "#f87171" },
    { name: "Transfers", value: catMap.transfer, color: "#60a5fa" },
  ].filter((d) => d.value > 0);

  // Stats
  const totalDeposited = catMap.deposit;
  const totalWithdrawn = catMap.withdraw + catMap.transfer;
  const netFlow = totalDeposited - totalWithdrawn;
  const txCount = transactions.length;

  return { monthlyData, categoryData, stats: { totalDeposited, totalWithdrawn, netFlow, txCount } };
}