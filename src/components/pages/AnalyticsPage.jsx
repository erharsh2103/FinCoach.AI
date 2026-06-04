import { GlassCard, formatCurrency } from "../widgets/widgetShared";

export function AnalyticsPage({ transactions, accounts }) {
  const income = transactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expenses = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const byCategory = transactions.filter(tx => tx.type === "expense").reduce((acc, tx) => ({ ...acc, [tx.category || "Others"]: (acc[tx.category || "Others"] || 0) + Number(tx.amount || 0) }), {});
  const savingsRate = income ? Math.round(((income - expenses) / income) * 100) : 0;
  const sourcePill = source => (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "999px",
      border: "1px solid rgba(96,165,250,0.28)",
      background: "rgba(37,99,235,0.14)",
      color: "var(--accent)",
      fontSize: "11px",
      fontWeight: "600"
    }}>{source}</span>
  );

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Analytics</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        {[["Savings Rate", `${savingsRate}%`, "var(--accent)"], ["Accounts", accounts.length, "var(--success)"], ["Expense Categories", Object.keys(byCategory).length, "#FBBF24"]].map(([label, value, color]) => (
          <GlassCard key={label} style={{ padding: "18px" }}>
            <div style={{ marginBottom: "10px" }}>{sourcePill(label === "Accounts" ? "Accounts" : "Transactions")}</div>
            <p style={{ margin: "0 0 6px", color: "var(--muted)" }}>{label}</p>
            <strong style={{ fontSize: "25px", color }}>{value}</strong>
          </GlassCard>
        ))}
      </div>
      <GlassCard style={{ padding: "20px" }}>
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "19px" }}>Category Breakdown</h2>
          {sourcePill("Transactions")}
        </div>
        {Object.entries(byCategory).length ? Object.entries(byCategory).map(([category, amount]) => {
          const pct = expenses ? Math.round((amount / expenses) * 100) : 0;
          return (
            <div key={category} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span>{category}</span><strong>{formatCurrency(amount)}</strong></div>
              <div style={{ height: "8px", background: "rgba(15,23,42,0.08)", borderRadius: "999px" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,var(--primary),var(--accent))" }} /></div>
            </div>
          );
        }) : <p style={{ color: "var(--muted)" }}>Add expenses to see analytics.</p>}
      </GlassCard>
    </div>
  );
}
