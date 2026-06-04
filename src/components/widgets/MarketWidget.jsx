import React from "react";
import { DataSourceBadge, GlassCard, formatCurrency, getFinanceSnapshot } from "./widgetShared";

export const MarketWidget = ({ profile, accounts = [], transactions = [] }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions });
  const savingRate = snapshot.savingsRate;
  const cashRatio = snapshot.totalBalance ? Math.round((snapshot.cashBalance / snapshot.totalBalance) * 100) : 0;
  const signals = [
    { label: "Saving rate", value: `${savingRate}%`, hint: savingRate >= 20 ? "Healthy pace" : "Could use a push", color: savingRate >= 20 ? "var(--success)" : "#FBBF24" },
    { label: "Cash buffer", value: `${cashRatio}%`, hint: `${formatCurrency(snapshot.cashBalance)} liquid`, color: "#0EA5E9" },
    { label: "Runway", value: `${Math.round(snapshot.emergencyMonths * 10) / 10} mo`, hint: `From ${formatCurrency(snapshot.monthlyIncomeTarget)} income plan`, color: "#F97316" }
  ];

  return (
    <GlassCard style={{ padding: "24px" }}>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: "13px" }}>Live snapshot</p>
        <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text)" }}>Money momentum</h3>
        <div style={{ marginTop: "8px" }}><DataSourceBadge source="Profile + Transactions + Accounts" /></div>
      </div>
      <div style={{ display: "grid", gap: "12px" }}>
        {signals.map(item => (
          <div key={item.label} style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--surface-alt)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>{item.label}</span>
              <strong style={{ color: item.color, fontSize: "18px" }}>{item.value}</strong>
            </div>
            <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "12px" }}>{item.hint}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
