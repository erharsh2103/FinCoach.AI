import React from "react";
import { DataSourceBadge, FeatureHubPage, GlassCard, formatCurrency, getFinanceSnapshot } from "./widgetShared";

export const Copilot = ({ profile, transactions = [], goalsData = [], billsData = [] }) => {
  const snapshot = getFinanceSnapshot({ profile, transactions, billsData, goalsData });
  const prompts = [
    `You spent ${formatCurrency(snapshot.expenses)} in ${snapshot.monthLabel}. Ask AI Coach how to trim the biggest category.`,
    `Your saved monthly income is ${formatCurrency(snapshot.monthlyIncomeTarget)} and your remaining budget is ${formatCurrency(snapshot.budgetRemaining)}. Ask for a budget plan that fits this profile.`,
    snapshot.upcomingBills[0]
      ? `Your next bill is ${snapshot.upcomingBills[0].name} on ${snapshot.upcomingBills[0].due}. Ask for a payment plan reminder.`
      : "You have no unpaid bills right now. Ask AI Coach how to build an emergency buffer.",
    snapshot.topGoal
      ? `Goal focus: ${snapshot.topGoal.name}. Ask for a monthly top-up plan to reach ${formatCurrency(snapshot.topGoal.target)}.`
      : "Ask AI Coach to suggest your first savings goal based on your income profile."
  ];

  return (
    <FeatureHubPage title="AI Copilot" subtitle="Personalized finance prompts generated from your current dashboard data.">
      <div style={{ display: "grid", gap: "14px" }}>
        {prompts.map(prompt => (
          <GlassCard key={prompt} style={{ padding: "20px" }}>
            <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Profile + Transactions + Goals + Bills" /></div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>{prompt}</p>
          </GlassCard>
        ))}
      </div>
    </FeatureHubPage>
  );
};
