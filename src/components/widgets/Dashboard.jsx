import React from "react";
import { AIScoreWidget } from "./AIScoreWidget";
import { MarketWidget } from "./MarketWidget";
import { DataSourceBadge, DonutChart, GlassCard, RingProgress, formatCurrency, getFinanceSnapshot } from "./widgetShared";

export const Dashboard = ({ profile, accounts = [], transactions = [], totalBalance, billsData = [], goalsData = [], setPage }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions, billsData, goalsData });
  const topGoalPercent = snapshot.topGoal
    ? Math.min(100, Math.round((Number(snapshot.topGoal.current || 0) / Math.max(1, Number(snapshot.topGoal.target || 1))) * 100))
    : 0;
  const headlineName = (profile?.name || "").trim() ? `${profile.name} ` : "";
  const summaryCards = [
    { label: "Budget", amount: formatCurrency(snapshot.monthlyIncomeTarget), icon: "↗", bg: "rgba(5,150,105,0.15)", iconColor: "#059669" },
    { label: "Spent", amount: formatCurrency(snapshot.expenses), icon: "↘", bg: "rgba(239,68,68,0.15)", iconColor: "#EF4444" },
    { label: "Left", amount: formatCurrency(snapshot.budgetRemaining), icon: "₹", bg: "rgba(245,158,11,0.16)", iconColor: "#F59E0B" }
  ];
  const spendingMix = [
    {
      label: "Essentials",
      amount: formatCurrency(snapshot.essentials),
      color: "#2563EB",
      pct: snapshot.expenses ? Math.round((snapshot.essentials / snapshot.expenses) * 100) : 0
    },
    {
      label: "Non-Essentials",
      amount: formatCurrency(snapshot.nonEssentials),
      color: "#059669",
      pct: snapshot.expenses ? Math.round((snapshot.nonEssentials / snapshot.expenses) * 100) : 0
    }
  ];

  return (
    <div style={{ color: "#fff", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>Good morning {headlineName}👋</p>
          <h1 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "800" }}>Financial Health</h1>
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", alignSelf: "center" }}>{snapshot.monthLabel}</div>
      </div>

      <GlassCard style={{ padding: "24px", marginBottom: "20px", border: "1px solid rgba(37,99,235,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 4px" }}>{snapshot.monthLabel}</p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: 0 }}>Budget Used</p>
            <div style={{ marginTop: "8px" }}><DataSourceBadge source="Profile + Transactions" /></div>
          </div>
          <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
            <RingProgress percent={snapshot.budgetUsedPercent} size={90} stroke={9} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "20px", fontWeight: "800" }}>{snapshot.budgetUsedPercent}%</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Budget</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginTop: "20px" }}>
          {summaryCards.map(item => (
            <div key={item.label} style={{ background: item.bg, borderRadius: "14px", padding: "14px 12px" }}>
              <span style={{ color: item.iconColor, fontSize: "16px" }}>{item.icon}</span>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "6px 0 4px" }}>{item.label}</p>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "16px", margin: 0 }}>{item.amount}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "18px", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
          <span>Total balance: <strong style={{ color: "#fff" }}>{formatCurrency(totalBalance ?? snapshot.totalBalance)}</strong></span>
          <span>Bank: <strong style={{ color: "#fff" }}>{formatCurrency(snapshot.bankBalance)}</strong></span>
          <span>Cash: <strong style={{ color: "#fff" }}>{formatCurrency(snapshot.cashBalance)}</strong></span>
          <span>Savings rate: <strong style={{ color: "#fff" }}>{snapshot.savingsRate}%</strong></span>
        </div>
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        <AIScoreWidget profile={profile} accounts={accounts} transactions={transactions} billsData={billsData} goalsData={goalsData} />
        <MarketWidget profile={profile} accounts={accounts} transactions={transactions} />
      </div>

      <GlassCard style={{ padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Spending Breakdown</h3>
            <div style={{ marginTop: "8px" }}><DataSourceBadge source="Transactions" /></div>
          </div>
          <span style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)", color: "#60A5FA", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
            {snapshot.monthLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <DonutChart essentials={snapshot.essentials} nonEssentials={snapshot.nonEssentials} />
          <div style={{ flex: 1, minWidth: "220px" }}>
            {spendingMix.map((item, index) => (
              <div key={item.label} style={{ marginBottom: index === 0 ? "16px" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{item.label}</span>
                  </div>
                  <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>{item.amount}</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                  <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: "4px", transition: "width 1s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {!snapshot.expenses && <p style={{ color: "rgba(255,255,255,0.5)", margin: "16px 0 0", fontSize: "13px" }}>Add transactions to see your live monthly spending mix.</p>}
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        <GlassCard style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Upcoming Bills</h3>
              <div style={{ marginTop: "8px" }}><DataSourceBadge source="Bills" /></div>
            </div>
            <span onClick={() => setPage?.("bills")} style={{ color: "#2563EB", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
          </div>
          {snapshot.upcomingBills.slice(0, 4).length ? snapshot.upcomingBills.slice(0, 4).map((bill, index) => (
            <div
              key={bill.id || `${bill.name}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: index < Math.min(snapshot.upcomingBills.length, 4) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  marginRight: "14px"
                }}
              >
                {bill.status === "overdue" ? "!" : "₹"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "15px" }}>{bill.name}</p>
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Due {bill.due}</p>
              </div>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>{formatCurrency(bill.amount)}</span>
            </div>
          )) : <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No unpaid bills right now.</p>}
        </GlassCard>

        <GlassCard style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Goal Progress</h3>
              <div style={{ marginTop: "8px" }}><DataSourceBadge source="Goals" /></div>
            </div>
            <span onClick={() => setPage?.("goals")} style={{ color: "#2563EB", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
          </div>
          {snapshot.topGoal ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                <strong>{snapshot.topGoal.name}</strong>
                <span>{topGoalPercent}%</span>
              </div>
              <div style={{ height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", marginBottom: "12px" }}>
                <div style={{ width: `${topGoalPercent}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>{formatCurrency(snapshot.topGoal.current)} of {formatCurrency(snapshot.topGoal.target)}</p>
              <p style={{ color: "rgba(255,255,255,0.45)", margin: 0, fontSize: "13px" }}>
                {snapshot.topGoal.deadline ? `Target date: ${snapshot.topGoal.deadline}` : "No deadline set yet."}
              </p>
            </>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Create a goal to track live progress here.</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
