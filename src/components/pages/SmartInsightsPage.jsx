import { GlassCard, FeatureHubPage, formatCurrency } from "../widgets/widgetShared";

export function SmartInsightsPage({ transactions, bills, goals }) {
  const expenseTotal = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const overdue = bills.filter(bill => bill.status === "overdue").length;
  const behindGoal = goals.find(goal => Number(goal.current || 0) / Number(goal.target || 1) < 0.35);
  const insights = [
    { title: "Spending Check", body: `You have logged ${formatCurrency(expenseTotal)} in expenses. Review top categories in Analytics.`, color: "#FBBF24" },
    { title: "Bill Alert", body: overdue ? `${overdue} bill needs attention.` : "No overdue bills. Nice and tidy.", color: overdue ? "var(--danger)" : "var(--success)" },
    { title: "Goal Momentum", body: behindGoal ? `${behindGoal.name} is below 35% progress. Add a small top-up this month.` : "Your active goals are moving well.", color: "var(--accent)" }
  ];
  return <FeatureHubPage title="Smart Insights" subtitle="Automated nudges based on transactions, bills, and goals."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>{insights.map(item => <GlassCard key={item.title} style={{ padding: "20px", border: `1px solid ${item.color}55` }}><h3 style={{ margin: "0 0 8px", color: item.color }}>{item.title}</h3><p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{item.body}</p></GlassCard>)}</div></FeatureHubPage>;
}
