import { FeatureHubPage } from "../widgets/widgetShared";

export function MorePage({ setPage }) {
  const items = [
    ["transactions", "Transactions"], ["analytics", "Analytics"], ["bills", "Bills"], ["networth", "Net Worth"],
    ["budgetplanner", "Budget Planner"], ["investadvisor", "Investment Advisor"],
    ["subscriptions", "Subscriptions"], ["cashpayments", "Cash Payments"], ["smartinsights", "Smart Insights"],
    ["aicopilot", "AI Copilot"], ["financialai", "Financial AI"], ["upgradeplan", "Upgrade Plan"], ["calculator", "Investment Calculator"], ["smartinsights", "Smart Insights"]
  ];
  return (
    <FeatureHubPage title="More" subtitle="All FinCoach tools and feature modules.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
        {items.map(([id, label]) => (
          <button key={id} onClick={() => setPage(id)} style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)", textAlign: "left", cursor: "pointer", fontWeight: 700 }}>
            {label}
          </button>
        ))}
      </div>
    </FeatureHubPage>
  );
}
