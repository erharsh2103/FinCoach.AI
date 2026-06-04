import React from "react";
import { DataSourceBadge, FeatureHubPage, GlassCard, formatCurrency, getFinanceSnapshot } from "./widgetShared";

const INSTRUMENTS = {
  Conservative: [
    { label: "FD / Recurring Deposit", pct: 40, desc: "Guaranteed returns, low risk. Best for building your emergency corpus.", icon: "🏦" },
    { label: "Debt Mutual Funds", pct: 25, desc: "Liquid or short-duration debt funds for steady, low-volatility income.", icon: "📄" },
    { label: "Gold / SGBs", pct: 15, desc: "Sovereign Gold Bonds — no storage risk, earns 2.5% annual interest.", icon: "🪙" },
    { label: "Large-Cap Equity SIP", pct: 10, desc: "Nifty 50 index funds for gradual equity exposure with low cost.", icon: "📈" },
    { label: "Emergency Cash", pct: 10, desc: "Liquid savings or sweep FD — keep at least 3 months of expenses ready.", icon: "💵" }
  ],
  Balanced: [
    { label: "Equity SIP (Index Funds)", pct: 45, desc: "Nifty 50 or Nifty Next 50 index funds via monthly SIP for long-term growth.", icon: "📈" },
    { label: "Debt / FD", pct: 25, desc: "Short-duration debt funds or bank FDs to anchor the portfolio.", icon: "🏦" },
    { label: "Mid-Cap / Flexi-Cap Funds", pct: 15, desc: "Higher growth potential with moderate risk — hold for 5+ years.", icon: "📊" },
    { label: "Gold / SGBs", pct: 10, desc: "Hedge against inflation and equity market downturns.", icon: "🪙" },
    { label: "Emergency Cash", pct: 5, desc: "Instant-access savings for unexpected expenses.", icon: "💵" }
  ],
  Growth: [
    { label: "Equity SIP (Flexi/Mid-Cap)", pct: 55, desc: "High-growth equity mutual funds for long-term compounding wealth.", icon: "🚀" },
    { label: "Small-Cap / Sectoral", pct: 20, desc: "Higher risk, higher reward — only invest amounts you can hold 5+ years.", icon: "📊" },
    { label: "US / International ETFs", pct: 10, desc: "Global diversification via Nasdaq or S&P 500 ETFs (Mirae, MON100).", icon: "🌐" },
    { label: "Gold / SGBs", pct: 10, desc: "Portfolio hedge — target ~10% allocation.", icon: "🪙" },
    { label: "Debt / Emergency Cash", pct: 5, desc: "Minimal debt exposure — keep 2 months expenses liquid.", icon: "💵" }
  ]
};

const ALLOC_COLORS = ["var(--primary)", "var(--accent)", "#F59E0B", "#8B5CF6", "#10B981"];

export const InvestmentAdvisor = ({ profile, accounts = [], transactions = [] }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions });
  const riskProfile = profile?.riskProfile || "Balanced";
  const instruments = INSTRUMENTS[riskProfile] || INSTRUMENTS.Balanced;
  const riskAccent = riskProfile === "Growth" ? "#F97316" : riskProfile === "Conservative" ? "#60A5FA" : "var(--accent)";

  const investable = Math.max(0, snapshot.budgetRemaining) ||
    Math.max(1000, snapshot.totalBalance * 0.08);
  const sipSuggestion = Math.round(investable * 0.6 / 500) * 500;
  const emergencyTarget = (snapshot.expenses || Number(profile?.monthlyIncome || 0) * 0.6) * 3;

  return (
    <FeatureHubPage
      title="Investment Advisor"
      subtitle={`Personalised allocation for your ${riskProfile} profile — based on live income and surplus.`}
    >
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Investable Surplus", value: formatCurrency(investable), sub: "budget remaining this month", color: "var(--primary)", icon: "💰" },
          { label: "Suggested SIP", value: formatCurrency(sipSuggestion), sub: "60% of surplus, rounded", color: riskAccent, icon: "📅" },
          { label: "Emergency Fund", value: `${Math.min(snapshot.emergencyMonths, 99).toFixed(1)} mo`, sub: `target 3–6 mo (${formatCurrency(emergencyTarget)})`, color: snapshot.emergencyMonths >= 3 ? "#10B981" : "#EF4444", icon: "🛡️" },
          { label: "Total Balance", value: formatCurrency(snapshot.totalBalance), sub: "across all accounts", color: "#8B5CF6", icon: "📊" }
        ].map(card => (
          <GlassCard key={card.label} style={{ padding: "18px" }}>
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>{card.icon}</div>
            <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "12px" }}>{card.label}</p>
            <strong style={{ display: "block", fontSize: "22px", color: card.color, marginBottom: "2px" }}>{card.value}</strong>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{card.sub}</span>
          </GlassCard>
        ))}
      </div>

      {/* Risk badge + data source */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <DataSourceBadge source="Profile + Transactions" />
        <span style={{ padding: "4px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: `${riskAccent}22`, color: riskAccent, border: `1px solid ${riskAccent}55` }}>
          {riskProfile} Risk Profile
        </span>
        {!profile?.riskProfile && (
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>→ Set risk profile in Profile page for personalised advice</span>
        )}
      </div>

      {/* Allocation cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {instruments.map((inst, i) => {
          const monthlyAmt = Math.round((investable * inst.pct) / 100);
          return (
            <GlassCard key={inst.label} style={{ padding: "20px", border: `1px solid ${ALLOC_COLORS[i % ALLOC_COLORS.length]}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{ fontSize: "24px" }}>{inst.icon}</span>
                <span style={{ fontWeight: "800", fontSize: "24px", color: ALLOC_COLORS[i % ALLOC_COLORS.length] }}>{inst.pct}%</span>
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: "700", fontSize: "15px", color: "var(--text)" }}>{inst.label}</p>
              <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: "12px", lineHeight: "1.5" }}>{inst.desc}</p>
              <div style={{ height: "5px", background: "rgba(15,23,42,0.07)", borderRadius: "4px", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${inst.pct}%`, background: ALLOC_COLORS[i % ALLOC_COLORS.length], borderRadius: "4px" }} />
              </div>
              <div style={{ background: `${ALLOC_COLORS[i % ALLOC_COLORS.length]}15`, borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Monthly amount</span>
                <strong style={{ color: ALLOC_COLORS[i % ALLOC_COLORS.length], fontSize: "15px" }}>{formatCurrency(monthlyAmt)}</strong>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Visual stacked allocation bar */}
      <GlassCard style={{ padding: "20px", marginBottom: "20px" }}>
        <p style={{ margin: "0 0 14px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>Portfolio Allocation View</p>
        <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden", gap: "2px", marginBottom: "14px" }}>
          {instruments.map((inst, i) => (
            <div key={inst.label}
              title={`${inst.label}: ${inst.pct}%`}
              style={{ flex: inst.pct, background: ALLOC_COLORS[i % ALLOC_COLORS.length], transition: "flex 0.5s ease" }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {instruments.map((inst, i) => (
            <div key={inst.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ALLOC_COLORS[i % ALLOC_COLORS.length], flexShrink: 0 }} />
              <span style={{ color: "var(--muted)" }}>{inst.label} <strong style={{ color: "var(--text)" }}>{inst.pct}%</strong></span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Disclaimer */}
      <GlassCard style={{ padding: "16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.6" }}>
          ⚠️ <strong style={{ color: "var(--text)" }}>Not financial advice.</strong> These allocations are illustrative based on your stated risk profile and current surplus. Consult a SEBI-registered investment advisor before making any investment decisions. Mutual fund investments are subject to market risks — read all scheme-related documents carefully.
        </p>
      </GlassCard>
    </FeatureHubPage>
  );
};
