import React from "react";
import { DataSourceBadge, GlassCard, getFinanceSnapshot } from "./widgetShared";

export const AIScoreWidget = ({ profile, accounts = [], transactions = [], billsData = [], goalsData = [] }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions, billsData, goalsData });
  const score = snapshot.resilienceScore;
  const tone = score >= 80 ? "var(--success)" : score >= 60 ? "#FBBF24" : "#EF4444";
  const status = score >= 80 ? "Strong" : score >= 60 ? "Improving" : "Needs attention";
  const reasons = [
    `${Math.max(0, Math.round(snapshot.emergencyMonths * 10) / 10)} months of cash cover`,
    `${snapshot.savingsRate}% current savings rate`,
    `${Math.round(snapshot.paidBillsRatio * 100)}% bills paid on time`
  ];

  return (
    <GlassCard style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: "13px" }}>AI score</p>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text)" }}>Financial resilience</h3>
          <div style={{ marginTop: "8px" }}><DataSourceBadge source="Profile + Transactions + Accounts" /></div>
        </div>
        <div style={{ minWidth: "72px", textAlign: "right" }}>
          <strong style={{ display: "block", fontSize: "30px", color: tone }}>{score}</strong>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{status}</span>
        </div>
      </div>
      <div style={{ height: "10px", borderRadius: "999px", background: "rgba(15,23,42,0.07)", overflow: "hidden", marginBottom: "14px" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${tone}, var(--primary))` }} />
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {reasons.map(reason => (
          <div key={reason} style={{ color: "var(--muted)", fontSize: "13px" }}>{reason}</div>
        ))}
      </div>
    </GlassCard>
  );
};
