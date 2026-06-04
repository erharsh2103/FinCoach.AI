import { GlassCard, FeatureHubPage, formatCurrency } from "../widgets/widgetShared";

export function NetWorthPage({ accounts }) {
  const assets = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.balance || 0)), 0);
  const liabilities = accounts.reduce((sum, account) => sum + Math.max(0, -Number(account.balance || 0)), 0);
  return <FeatureHubPage title="Net Worth" subtitle="Track assets, liabilities, and your overall financial position."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>{[["Assets", assets, "var(--success)"], ["Liabilities", liabilities, "var(--danger)"], ["Net Worth", assets - liabilities, "var(--accent)"]].map(([l, v, c]) => <GlassCard key={l} style={{ padding: "20px" }}><p style={{ color: "var(--muted)", margin: "0 0 8px" }}>{l}</p><strong style={{ color: c, fontSize: "28px" }}>{formatCurrency(v)}</strong></GlassCard>)}</div>{!accounts.length && <p style={{ color: "var(--muted)", marginTop: "16px" }}>Add accounts to calculate your net worth.</p>}</FeatureHubPage>;
}
