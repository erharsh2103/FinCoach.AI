import React from "react";
import { AIScoreWidget } from "./AIScoreWidget";
import { MarketWidget } from "./MarketWidget";
import { DataSourceBadge, GlassCard, formatCurrency, getFinanceSnapshot } from "./widgetShared";

const DONUT_COLORS = ["var(--primary)", "var(--primary-soft)", "var(--accent)", "var(--surface-soft)"];

// ── helpers ──────────────────────────────────────────────────────────────
const firstNameOf = profile => (profile?.name || "").trim().split(/\s+/)[0] || "there";

const fmtDate = iso => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Last 5 calendar months of summed transactions (optionally filtered by type).
const monthlySeries = (transactions, type) => {
  const now = new Date();
  return Array.from({ length: 5 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - idx), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const value = transactions
      .filter(tx => String(tx.date || "").startsWith(key) && (!type || tx.type === type))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return { label: d.toLocaleDateString("en-IN", { month: "short" }), value };
  });
};

// Smooth curve (horizontal-tangent cubic) through points for the sparkline.
const smoothLine = pts =>
  pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p[0]},${p[1]}`;
    const prev = a[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    return `${acc} C ${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }, "");

// ── sub-components ───────────────────────────────────────────────────────
function TrendMini({ series }) {
  const values = series.map(s => s.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const W = 130, H = 58, pad = 6;
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - pad - ((v - min) / span) * (H - pad * 2)
  ]);
  const line = smoothLine(pts);
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
      {/* sparkline */}
      <svg width={W} height={H} style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trend-fill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* bars */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px", height: H }}>
        {series.map((s, i) => {
          const h = Math.max(8, (s.value / max) * (H - 16));
          const isLast = i === series.length - 1;
          return (
            <div key={s.label + i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", flex: 1 }}>
              <div style={{
                width: "100%", maxWidth: "16px", height: `${h}px`, borderRadius: "6px",
                background: isLast ? "var(--primary)" : "var(--primary-soft)", opacity: isLast ? 1 : 0.55
              }} />
              <span style={{ fontSize: "10px", color: "var(--muted)" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniDonut({ segments, centerTop, centerBottom, size = 116, stroke = 15 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(20,24,40,0.06)" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const dash = c * (seg.value / total);
          const node = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color}
              strokeWidth={stroke} strokeDasharray={`${Math.max(0, dash - 2)} ${c - Math.max(0, dash - 2)}`}
              strokeDashoffset={-offset} strokeLinecap="round" />
          );
          offset += dash;
          return node;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "24px", fontWeight: "800", color: "var(--text)" }}>{centerTop}</span>
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>{centerBottom}</span>
      </div>
    </div>
  );
}

// ── main dashboard ─────────────────────────────────────────────────────────
export const Dashboard = ({ profile, accounts = [], transactions = [], totalBalance, billsData = [], goalsData = [], setPage, plan = "free" }) => {
  const snapshot = getFinanceSnapshot({ profile, accounts, transactions, billsData, goalsData });
  const balance = totalBalance ?? snapshot.totalBalance;
  const topGoalPercent = snapshot.topGoal
    ? Math.min(100, Math.round((Number(snapshot.topGoal.current || 0) / Math.max(1, Number(snapshot.topGoal.target || 1))) * 100))
    : 0;

  // Spending trend (last 5 months) for the Balance Statistics chart.
  const spendSeries = monthlySeries(transactions, "expense");
  const latest = spendSeries[spendSeries.length - 1].value;
  const prev = spendSeries[spendSeries.length - 2].value;
  const pctChange = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : null;

  // Expenses vs Income (current month).
  const incomeM = snapshot.income;
  const expenseM = snapshot.expenses;
  const totalFlow = incomeM + expenseM;
  const expPct = totalFlow ? Math.round((expenseM / totalFlow) * 100) : 0;
  const incPct = totalFlow ? 100 - expPct : 0;

  // Category breakdown for the Analytics donut.
  const byCategory = transactions
    .filter(tx => tx.type === "expense")
    .reduce((acc, tx) => {
      const cat = tx.category || "Other";
      acc[cat] = (acc[cat] || 0) + Number(tx.amount || 0);
      return acc;
    }, {});
  const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCats = catEntries.slice(0, 3);
  const otherSum = catEntries.slice(3).reduce((s, [, v]) => s + v, 0);
  const donutSegments = [
    ...topCats.map(([name, value], i) => ({ name, value, color: DONUT_COLORS[i] })),
    ...(otherSum > 0 ? [{ name: "Other", value: otherSum, color: DONUT_COLORS[3] }] : [])
  ];

  // Recent transactions.
  const recent = [...transactions].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 3);

  // Primary account → credit card visual.
  const primaryAccount = accounts.find(a => a.type === "bank") || accounts[0];
  const cardHash = String(primaryAccount?.id || profile?.name || "fincoach")
    .split("")
    .reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const last4 = String(cardHash % 10000).padStart(4, "0");
  const bankName = (primaryAccount?.name || "The Bank of Anything").toUpperCase();

  // Net Worth (moved from NetWorthPage).
  const assets = accounts.reduce((s, a) => s + Math.max(0, Number(a.balance || 0)), 0);
  const liabilities = accounts.reduce((s, a) => s + Math.max(0, -Number(a.balance || 0)), 0);
  const netWorth = assets - liabilities;

  // 50/30/20 budget (moved from BudgetPlanner).
  const latestIncomeTx = [...transactions].filter(t => t.type === "income").sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
  const planIncome = Number(profile?.monthlyIncome || 0) || Number(latestIncomeTx?.amount || 0) || 0;
  const budgetRows = [
    ["Needs", 0.5, "Bills, food, transport"],
    ["Wants", 0.3, "Lifestyle & fun"],
    ["Savings", 0.2, "Future-you money"]
  ];

  // Smart Insights (moved from SmartInsightsPage).
  const allExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const overdueCount = billsData.filter(b => b.status === "overdue").length;
  const behindGoal = goalsData.find(g => Number(g.current || 0) / Math.max(1, Number(g.target || 1)) < 0.35);
  const insights = [
    { title: "Spending Check", body: `You've logged ${formatCurrency(allExpense)} in expenses. Review categories in Analytics.`, color: "var(--accent)" },
    { title: "Bill Alert", body: overdueCount ? `${overdueCount} bill${overdueCount > 1 ? "s" : ""} need attention.` : "No overdue bills — all tidy.", color: overdueCount ? "var(--danger)" : "var(--success)" },
    { title: "Goal Momentum", body: behindGoal ? `${behindGoal.name} is below 35% — add a small top-up.` : (goalsData.length ? "Your goals are moving well." : "Create a goal to track momentum."), color: "var(--primary)" }
  ];

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui", maxWidth: "1280px", margin: "0 auto" }}>

      {/* ── Greeting (text left, account pill right) ── */}
      <div className="dash-greeting">
        <div>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Hello, <span style={{ color: "var(--primary)" }}>{firstNameOf(profile)}</span>
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "15px" }}>View and control your finances here!</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "999px", padding: "6px 8px 6px 12px", boxShadow: "var(--card-shadow)" }}>
          {accounts.length === 0 ? (
            <span style={{ color: "var(--muted)", fontSize: "14px", paddingRight: "2px" }}>No accounts yet</span>
          ) : (
            <div style={{ display: "flex" }}>
              {accounts.slice(0, 4).map((acc, i) => (
                <div key={acc.id || i} title={acc.name} style={{
                  width: "34px", height: "34px", borderRadius: "50%", marginLeft: i === 0 ? 0 : "-10px",
                  background: "linear-gradient(135deg,var(--primary-soft),var(--primary))",
                  border: "2px solid var(--surface)", color: "#fff", fontWeight: "700", fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {(acc.name || "A").slice(0, 1).toUpperCase()}
                </div>
              ))}
              {accounts.length > 4 && (
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%", marginLeft: "-10px",
                  background: "var(--surface-soft)", border: "2px solid var(--surface)", color: "var(--text)",
                  fontWeight: "700", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"
                }}>+{accounts.length - 4}</div>
              )}
            </div>
          )}
          <button onClick={() => setPage?.("accounts")} aria-label="View accounts" style={{
            width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border)",
            background: "var(--surface-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)"
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </div>
      </div>

      {/* ── Bento grid ── */}
      <div className="dash-bento">

        {/* Balance Statistics */}
        <GlassCard className="dash-a-balance" style={{ padding: "22px" }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Balance Statistics</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", margin: "10px 0 18px" }}>
            <span style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.02em" }}>{formatCurrency(balance)}</span>
            <span style={{ color: "var(--muted)", fontSize: "13px" }}>Total amount</span>
          </div>
          <TrendMini series={spendSeries} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
            {pctChange !== null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontWeight: "700", fontSize: "15px", color: pctChange >= 0 ? "var(--danger)" : "var(--success)" }}>
                {pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange)}%
              </span>
            )}
            <span style={{ color: "var(--muted)", fontSize: "12px" }}>Spending trend, last 5 months</span>
          </div>
        </GlassCard>

        {/* Credit card */}
        <div className="dash-a-card" onClick={() => setPage?.("accounts")} style={{
          cursor: "pointer", borderRadius: "22px", padding: "22px",
          background: "linear-gradient(135deg,var(--primary-soft) 0%,var(--primary) 100%)",
          color: "#fff", boxShadow: "0 14px 30px rgba(15,185,129,0.32)", position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column"
        }}>
          <p style={{ margin: 0, fontSize: "12px", letterSpacing: "0.14em", opacity: 0.85 }}>{bankName}</p>
          <div style={{ width: "44px", height: "30px", borderRadius: "7px", background: "rgba(255,255,255,0.9)", margin: "18px 0" }} />
          <span style={{ fontSize: "19px", letterSpacing: "0.18em" }}>•••• •••• •••• {last4}</span>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto", paddingTop: "18px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "10px", letterSpacing: "0.1em", opacity: 0.8 }}>CARD HOLDER</p>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{profile?.name || "Card Holder"}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.45)", marginLeft: "-12px" }} />
            </div>
          </div>
        </div>

        {/* Analytics donut */}
        <GlassCard className="dash-a-analytics" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Analytics</p>
            <span onClick={() => setPage?.("analytics")} style={{ color: "var(--primary)", fontSize: "12px", cursor: "pointer" }}>Details ›</span>
          </div>
          {donutSegments.length ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <MiniDonut segments={donutSegments} centerTop={`${snapshot.budgetUsedPercent}%`} centerBottom="Used" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {donutSegments.map(seg => (
                  <div key={seg.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seg.name}</span>
                    <span style={{ color: "var(--text)", fontWeight: "600" }}>{formatCurrency(seg.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: "13px", margin: "20px 0", textAlign: "center" }}>Add expenses to see your spending analytics.</p>
          )}
        </GlassCard>

        {/* Last Transactions */}
        <GlassCard className="dash-a-transactions" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Last Transactions</p>
            <span onClick={() => setPage?.("transactions")} style={{ color: "var(--primary)", fontSize: "12px", cursor: "pointer" }}>See all ›</span>
          </div>
          {recent.length ? recent.map((tx, i) => {
            const isIncome = tx.type === "income";
            return (
              <div key={tx.id || i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "50%", marginRight: "12px", flexShrink: 0,
                  background: "var(--surface-alt)", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "700", color: "var(--primary)", fontSize: "16px"
                }}>
                  {(tx.description || "?").slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description || "Transaction"}</p>
                  <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>{fmtDate(tx.date)}</p>
                </div>
                <span style={{ fontWeight: "700", fontSize: "15px", color: isIncome ? "var(--success)" : "var(--text)" }}>
                  {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            );
          }) : <p style={{ color: "var(--muted)", margin: "8px 0 0", fontSize: "13px" }}>No transactions yet. Add one to get started.</p>}
        </GlassCard>

        {/* Expenses & Income */}
        <GlassCard className="dash-a-expenses" style={{ padding: "20px" }}>
          <p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: "700" }}>Expenses &amp; Income</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>{expPct}%</p>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>Expenses</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>{incPct}%</p>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>Income</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ height: "10px", borderRadius: "999px", background: "var(--primary)", flex: Math.max(expPct, 4) }} />
            <div style={{ height: "10px", borderRadius: "999px", background: "var(--accent)", flex: Math.max(incPct, 4) }} />
          </div>
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Spent this month</span>
              <strong>{formatCurrency(expenseM)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Earned this month</span>
              <strong>{formatCurrency(incomeM)}</strong>
            </div>
          </div>
        </GlassCard>

        {/* Premium promo */}
        {plan === "free" && (
          <div className="dash-a-premium" style={{
            background: "var(--ink)", borderRadius: "20px", padding: "22px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>
            <p style={{ margin: 0, color: "#fff", fontWeight: "700", fontSize: "17px" }}>✦ More features?</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "13px", flex: 1 }}>Update your account to premium to get more features.</p>
            <button onClick={() => setPage?.("upgradeplan")} style={{
              background: "#fff", color: "var(--ink)", border: "none", borderRadius: "999px",
              padding: "12px 18px", fontWeight: "700", fontSize: "14px", cursor: "pointer", width: "100%"
            }}>Go to premium</button>
          </div>
        )}
      </div>

      {/* ── Retained feature widgets (unchanged data, re-themed) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
        <AIScoreWidget profile={profile} accounts={accounts} transactions={transactions} billsData={billsData} goalsData={goalsData} />
        <MarketWidget profile={profile} accounts={accounts} transactions={transactions} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <GlassCard style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Upcoming Bills</h3>
              <div style={{ marginTop: "8px" }}><DataSourceBadge source="Bills" /></div>
            </div>
            <span onClick={() => setPage?.("bills")} style={{ color: "var(--primary)", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
          </div>
          {snapshot.upcomingBills.slice(0, 4).length ? snapshot.upcomingBills.slice(0, 4).map((bill, index) => (
            <div key={bill.id || `${bill.name}-${index}`} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: index < Math.min(snapshot.upcomingBills.length, 4) - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: bill.status === "overdue" ? "rgba(242,84,91,0.12)" : "var(--surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", marginRight: "12px", flexShrink: 0 }}>
                {bill.status === "overdue" ? "⚠️" : "🧾"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "15px" }}>{bill.name}</p>
                <p style={{ margin: "2px 0 0", color: bill.status === "overdue" ? "var(--danger)" : "var(--muted)", fontSize: "12px" }}>
                  {bill.status === "overdue" ? "Overdue — pay now" : `Due ${bill.due}`}
                </p>
              </div>
              <span style={{ fontWeight: "700", fontSize: "15px", color: bill.status === "overdue" ? "var(--danger)" : "var(--text)" }}>{formatCurrency(bill.amount)}</span>
            </div>
          )) : <p style={{ color: "var(--muted)", margin: 0 }}>No unpaid bills right now.</p>}
        </GlassCard>

        <GlassCard style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Goal Progress</h3>
              <div style={{ marginTop: "8px" }}><DataSourceBadge source="Goals" /></div>
            </div>
            <span onClick={() => setPage?.("goals")} style={{ color: "var(--primary)", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
          </div>
          {snapshot.topGoal ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                <strong>{snapshot.topGoal.name}</strong>
                <span style={{ color: topGoalPercent >= 75 ? "var(--success)" : "var(--text)" }}>{topGoalPercent}%</span>
              </div>
              <div style={{ height: "9px", background: "rgba(20,24,40,0.07)", borderRadius: "999px", marginBottom: "12px" }}>
                <div style={{ width: `${topGoalPercent}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,var(--primary),var(--primary-soft))", transition: "width 1s ease" }} />
              </div>
              <p style={{ color: "var(--muted)", margin: "0 0 8px" }}>{formatCurrency(snapshot.topGoal.current)} of {formatCurrency(snapshot.topGoal.target)}</p>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "13px" }}>
                {snapshot.topGoal.deadline ? `Target date: ${snapshot.topGoal.deadline}` : "No deadline set yet."}
              </p>
            </>
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>Create a goal to track live progress here.</p>
          )}
        </GlassCard>
      </div>

      {/* ── Net Worth · Budget · Smart Insights (moved from standalone tabs) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginTop: "16px" }}>
        <GlassCard style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700 }}>Net Worth</h3>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--muted)" }}>Assets</span><strong style={{ color: "var(--success)" }}>{formatCurrency(assets)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--muted)" }}>Liabilities</span><strong style={{ color: "var(--danger)" }}>{formatCurrency(liabilities)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 0 0" }}>
            <span style={{ fontWeight: 700 }}>Net Worth</span><strong style={{ fontSize: "20px" }}>{formatCurrency(netWorth)}</strong>
          </div>
          {!accounts.length && <p style={{ color: "var(--muted)", margin: "10px 0 0", fontSize: "13px" }}>Add accounts to calculate net worth.</p>}
        </GlassCard>

        <GlassCard style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700 }}>Budget Planner · 50/30/20</h3>
          {planIncome ? budgetRows.map(([label, pct, hint]) => (
            <div key={label} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "14px" }}>
                <span>{label}</span><strong>{formatCurrency(planIncome * pct)}</strong>
              </div>
              <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: "11px" }}>{hint}</p>
              <div style={{ height: "8px", background: "rgba(20,40,32,0.08)", borderRadius: "999px" }}>
                <div style={{ width: `${pct * 100}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,var(--primary),var(--primary-soft))" }} />
              </div>
            </div>
          )) : <p style={{ color: "var(--muted)", margin: 0, fontSize: "13px" }}>Add monthly income in Profile (or log an income) to generate a plan.</p>}
        </GlassCard>

        <GlassCard style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700 }}>Smart Insights</h3>
          {insights.map((item, i) => (
            <div key={item.title} style={{ padding: "10px 0", borderBottom: i < insights.length - 1 ? "1px solid var(--border)" : "none" }}>
              <p style={{ margin: "0 0 3px", fontWeight: 600, color: item.color, fontSize: "14px" }}>{item.title}</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>{item.body}</p>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
};
