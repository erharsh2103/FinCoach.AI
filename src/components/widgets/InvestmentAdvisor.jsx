import React from "react";
import { DataSourceBadge, FeatureHubPage, GlassCard, formatCurrency, getFinanceSnapshot } from "./widgetShared";

export const InvestmentAdvisor = ({ profile, accounts = [], transactions = [] }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions });
  const risk = snapshot.riskMeta;
  const monthlyInvestable = Math.max(
    0,
    snapshot.budgetRemaining
  ) || Math.max(1000, accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0) * 0.08);
  const buckets = [
    ["Equity SIP", risk.equity],
    ["Debt / FD", risk.debt],
    ["Gold", risk.gold],
    ["Emergency Cash", risk.cash]
  ];

  return (
    <FeatureHubPage title="Investment Advisor" subtitle={`Suggested allocation based on your ${profile?.riskProfile || "Balanced"} profile and available surplus.`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {buckets.map(([label, pct]) => (
          <GlassCard key={label} style={{ padding: "18px", border: `1px solid ${risk.accent}44` }}>
            <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Profile + Transactions" /></div>
            <p style={{ margin: "0 0 6px" }}>{label}</p>
            <strong style={{ display: "block", fontSize: "26px", color: risk.accent }}>{pct}%</strong>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.55)" }}>{formatCurrency((monthlyInvestable * pct) / 100)} per month</p>
          </GlassCard>
        ))}
      </div>
    </FeatureHubPage>
  );
};
