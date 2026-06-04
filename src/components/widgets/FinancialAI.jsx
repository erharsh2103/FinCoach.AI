import React from "react";
import { DataSourceBadge, GlassCard, formatCurrency, getFinanceSnapshot, getRiskProfileMeta } from "./widgetShared";

const Bar = ({ pct, color }) => (
  <div style={{ height: "8px", background: "rgba(20,40,32,0.08)", borderRadius: "999px", overflow: "hidden" }}>
    <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", borderRadius: "999px", background: color, transition: "width 0.8s ease" }} />
  </div>
);

export const FinancialAI = ({ profile, accounts = [], transactions = [], goalsData = [], billsData = [] }) => {
  const snap = getFinanceSnapshot({ profile, accounts, transactions, goalsData, billsData });
  const income = snap.monthlyIncomeTarget;
  const surplus = Math.max(0, income - snap.expenses);
  const liabilities = accounts.reduce((s, a) => s + Math.max(0, -Number(a.balance || 0)), 0);
  const runwayMonths = snap.emergencyMonths || 0;
  const runwayPct = Math.min(100, (runwayMonths / 6) * 100); // 6-month target
  const alloc = getRiskProfileMeta(profile);

  // KPI tiles
  const kpis = [
    { label: "Resilience score", value: `${snap.resilienceScore}/100`, hint: "Blended financial health" },
    { label: "Emergency runway", value: `${runwayMonths.toFixed(1)} mo`, hint: "Balance ÷ monthly spend" },
    { label: "Savings rate", value: `${snap.savingsRate}%`, hint: `${snap.monthLabel}` },
    { label: "Monthly surplus", value: formatCurrency(surplus), hint: "Income − spending" }
  ];

  // 50/30/20 vs actual
  const planRows = [
    { label: "Needs", target: income * 0.5, actual: snap.essentials, color: "var(--primary)" },
    { label: "Wants", target: income * 0.3, actual: snap.nonEssentials, color: "var(--accent)" },
    { label: "Savings", target: income * 0.2, actual: surplus, color: "var(--success)" }
  ];

  // 12-month projected balance (current balance + surplus accrual)
  const projection = Array.from({ length: 12 }, (_, i) => snap.totalBalance + surplus * (i + 1));
  const projMax = Math.max(...projection, 1);

  const allocRows = [
    ["Equity", alloc.equity, "var(--primary)"],
    ["Debt", alloc.debt, "var(--primary-soft)"],
    ["Gold", alloc.gold, "var(--accent)"],
    ["Cash", alloc.cash, "var(--surface-soft)"]
  ];

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui", maxWidth: "960px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "0 0 6px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>⚡ Financial AI</h1>
        <span style={{ background: "rgba(15,185,129,0.12)", color: "var(--primary)", border: "1px solid rgba(15,185,129,0.25)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>Live from your data</span>
      </div>
      <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "14px" }}>Planning projections computed from your balances, spending, goals, and risk profile.</p>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "16px" }}>
        {kpis.map(k => (
          <GlassCard key={k.label} style={{ padding: "18px" }}>
            <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: "12px" }}>{k.label}</p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>{k.value}</p>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "11px" }}>{k.hint}</p>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Emergency fund */}
        <GlassCard style={{ padding: "20px" }}>
          <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Balances + Spending" /></div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px" }}>Emergency fund</h3>
          <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: "13px" }}>
            You can cover <strong style={{ color: "var(--text)" }}>{runwayMonths.toFixed(1)} months</strong> of spending. Target is 6 months ({formatCurrency(snap.expenses * 6)}).
          </p>
          <Bar pct={runwayPct} color="linear-gradient(90deg,var(--primary),var(--primary-soft))" />
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: runwayMonths >= 6 ? "var(--success)" : "var(--muted)" }}>
            {runwayMonths >= 6 ? "Fully funded — nice cushion." : `Add ${formatCurrency(Math.max(0, snap.expenses * 6 - snap.totalBalance))} to hit 6 months.`}
          </p>
        </GlassCard>

        {/* 50/30/20 vs actual */}
        <GlassCard style={{ padding: "20px" }}>
          <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Income + Transactions" /></div>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>50/30/20 — plan vs actual</h3>
          {income ? planRows.map(r => (
            <div key={r.label} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                <span>{r.label}</span>
                <span style={{ color: "var(--muted)" }}>{formatCurrency(r.actual)} <span style={{ opacity: 0.6 }}>/ {formatCurrency(r.target)}</span></span>
              </div>
              <Bar pct={r.target ? (r.actual / r.target) * 100 : 0} color={r.color} />
            </div>
          )) : <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>Set monthly income in Profile to compare.</p>}
        </GlassCard>

        {/* Risk allocation */}
        <GlassCard style={{ padding: "20px" }}>
          <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Risk profile" /></div>
          <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Suggested allocation <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "13px" }}>· {profile?.riskProfile || "Balanced"}</span></h3>
          {allocRows.map(([label, pct, color]) => (
            <div key={label} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                <span>{label}</span><strong>{pct}%</strong>
              </div>
              <Bar pct={pct} color={color} />
            </div>
          ))}
        </GlassCard>

        {/* 12-month projection */}
        <GlassCard style={{ padding: "20px" }}>
          <div style={{ marginBottom: "10px" }}><DataSourceBadge source="Surplus projection" /></div>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px" }}>12-month balance projection</h3>
          <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "13px" }}>
            At {formatCurrency(surplus)}/mo surplus, projected balance reaches <strong style={{ color: "var(--text)" }}>{formatCurrency(projection[11])}</strong>.
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "90px" }}>
            {projection.map((v, i) => (
              <div key={i} title={formatCurrency(v)} style={{
                flex: 1, height: `${(v / projMax) * 100}%`, minHeight: "6px", borderRadius: "4px 4px 0 0",
                background: "linear-gradient(180deg,var(--primary-soft),var(--primary))", opacity: 0.55 + (i / 11) * 0.45
              }} />
            ))}
          </div>
        </GlassCard>
      </div>

      {liabilities > 0 && (
        <GlassCard style={{ padding: "18px", marginTop: "16px", border: "1px solid rgba(242,84,91,0.3)" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--danger)" }}>Debt watch</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
            You carry {formatCurrency(liabilities)} in negative balances. Clearing high-interest debt usually beats investing the same amount.
          </p>
        </GlassCard>
      )}

      <p style={{ margin: "16px 2px 0", color: "var(--muted)", fontSize: "11px", fontStyle: "italic" }}>
        Educational projections only — not financial advice. Consult a SEBI-registered advisor before investing.
      </p>
    </div>
  );
};
