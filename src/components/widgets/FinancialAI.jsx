import React from "react";
import { DataSourceBadge, FeatureHubPage, GlassCard, formatCurrency, getFinanceSnapshot } from "./widgetShared";

export const FinancialAI = ({ profile, accounts = [], transactions = [], goalsData = [], billsData = [] }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions, goalsData, billsData });
  const modules = [
    {
      title: "Tax-ready savings",
      body: `Monthly surplus: ${formatCurrency(snapshot.budgetRemaining)}. This updates directly from your saved monthly income and current spending.`
    },
    {
      title: "Risk posture",
      body: profile?.riskProfile ? `Current profile: ${profile.riskProfile}. Allocations should match this risk appetite.` : "Set your risk profile in Profile to unlock more precise recommendations."
    },
    {
      title: "Goal pacing",
      body: snapshot.topGoal ? `${snapshot.topGoal.name} is your leading goal. Keep momentum with scheduled monthly transfers.` : "Create at least one goal to unlock milestone planning."
    },
    {
      title: "Bill pressure",
      body: `${snapshot.upcomingBills.length} unpaid bills are currently on the radar. AI can sequence them around your cash flow.`
    },
    {
      title: "Budget discipline",
      body: `You have used ${snapshot.budgetUsedPercent}% of the monthly budget and still have ${formatCurrency(snapshot.budgetRemaining)} available.`
    }
  ];

  return (
    <FeatureHubPage title="Financial AI" subtitle="Advanced planning modules driven by your current balances, spending, and goals.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {modules.map(item => (
          <GlassCard key={item.title} style={{ padding: "18px" }}>
            <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Profile + Transactions + Goals + Bills" /></div>
            <strong>{item.title}</strong>
            <p style={{ color: "rgba(255,255,255,0.55)", margin: "10px 0 0", lineHeight: 1.6 }}>{item.body}</p>
          </GlassCard>
        ))}
      </div>
    </FeatureHubPage>
  );
};
