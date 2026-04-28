import React from "react";
import { FeatureHubPage, GlassCard, formatCurrency } from "./widgetShared";

export const BudgetPlanner = ({ profile, transactions = [] }) => {
  const monthlyIncome = Number(profile?.monthlyIncome || 0);
  const latestIncome = transactions
    .filter(tx => tx.type === "income")
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
  const income = monthlyIncome || Number(latestIncome?.amount || 0) || 0;
  const rows = [
    ["Needs", 0.5, "Bills, food, transport"],
    ["Wants", 0.3, "Lifestyle and fun"],
    ["Savings & Investments", 0.2, "Future-you money"]
  ];

  return (
    <FeatureHubPage title="Budget Planner" subtitle="Use the 50/30/20 rule to plan spending from your live monthly income.">
      <GlassCard style={{ padding: "22px" }}>
        {!income ? (
          <p style={{ margin: 0, color: "rgba(255,255,255,0.55)" }}>Add your monthly income in Profile or log an income transaction to generate a plan.</p>
        ) : (
          <>
        {rows.map(([label, pct, hint]) => (
          <div key={label} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>{label}</span>
              <strong>{formatCurrency(income * pct)}</strong>
            </div>
            <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{hint}</p>
            <div style={{ height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "999px" }}>
              <div style={{ width: `${pct * 100}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} />
            </div>
          </div>
        ))}
          </>
        )}
      </GlassCard>
    </FeatureHubPage>
  );
};
