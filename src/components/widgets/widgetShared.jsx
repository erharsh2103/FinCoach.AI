import React from "react";

export const formatCurrency = value => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "12px",
  padding: "14px 16px",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "system-ui"
};

export function GlassCard({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function FeatureHubPage({ title, subtitle, children }) {
  return (
    <div style={{ color: "#fff", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: "800" }}>{title}</h1>
      <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.55)" }}>{subtitle}</p>
      {children}
    </div>
  );
}

export function DataSourceBadge({ source }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(96,165,250,0.28)",
        background: "rgba(37,99,235,0.14)",
        color: "#93C5FD",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.02em"
      }}
    >
      {source}
    </span>
  );
}

export function RingProgress({ percent, size = 100, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#widget-grad)"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <defs>
        <linearGradient id="widget-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DonutChart({ essentials, nonEssentials }) {
  const total = essentials + nonEssentials;
  if (!total) {
    return (
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
      </svg>
    );
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const essentialsDash = circumference * (essentials / total);
  const nonEssentialsDash = circumference * (nonEssentials / total);

  return (
    <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#2563EB"
        strokeWidth="18"
        strokeDasharray={`${essentialsDash} ${circumference - essentialsDash}`}
        strokeLinecap="round"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#059669"
        strokeWidth="18"
        strokeDasharray={`${nonEssentialsDash} ${circumference - nonEssentialsDash}`}
        strokeDashoffset={-essentialsDash}
        strokeLinecap="round"
      />
    </svg>
  );
}

export const getMonthLabel = isoMonth => {
  const [year, month] = String(isoMonth || "").split("-");
  if (!year || !month) return "This month";
  return new Date(Number(year), Math.max(0, Number(month) - 1), 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
};

export const getRiskProfileMeta = profile => {
  const risk = String(profile?.riskProfile || "").toLowerCase();
  if (risk.includes("aggressive")) return { equity: 70, debt: 15, gold: 10, cash: 5, accent: "#F97316" };
  if (risk.includes("conservative")) return { equity: 35, debt: 40, gold: 15, cash: 10, accent: "#60A5FA" };
  return { equity: 55, debt: 25, gold: 10, cash: 10, accent: "#34D399" };
};

export const getFinanceSnapshot = ({ profile, accounts = [], transactions = [], billsData = [], goalsData = [] }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const transactionMonths = [...new Set(transactions.map(tx => String(tx.date || "").slice(0, 7)).filter(Boolean))].sort();
  const activeMonth = transactionMonths.includes(currentMonth)
    ? currentMonth
    : transactionMonths[transactionMonths.length - 1] || currentMonth;
  const activeTransactions = transactions.filter(tx => String(tx.date || "").startsWith(activeMonth));
  const income = activeTransactions
    .filter(tx => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expenses = activeTransactions
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const essentialsCategories = new Set(["Bills", "Health", "Transport", "Groceries", "Rent", "Utilities", "Food"]);
  const essentials = activeTransactions
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + (essentialsCategories.has(tx.category) ? Number(tx.amount || 0) : 0), 0);
  const nonEssentials = Math.max(0, expenses - essentials);
  const bankBalance = accounts
    .filter(account => account.type === "bank")
    .reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const cashBalance = accounts
    .filter(account => account.type === "cash")
    .reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const monthlyIncomeTarget = Number(profile?.monthlyIncome || 0) || income || 1;
  const budgetUsedPercent = Math.max(0, Math.min(100, Math.round((expenses / monthlyIncomeTarget) * 100)));
  const budgetRemaining = Math.max(0, monthlyIncomeTarget - expenses);
  const savingsRate = monthlyIncomeTarget ? Math.max(0, Math.round(((monthlyIncomeTarget - expenses) / monthlyIncomeTarget) * 100)) : 0;
  const upcomingBills = [...billsData]
    .filter(bill => bill.status !== "paid")
    .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));
  const topGoal = [...goalsData].sort(
    (a, b) =>
      Number(b.current || 0) / Math.max(1, Number(b.target || 1)) -
      Number(a.current || 0) / Math.max(1, Number(a.target || 1))
  )[0];
  const riskMeta = getRiskProfileMeta(profile);
  const paidBillsRatio = billsData.length ? billsData.filter(bill => bill.status === "paid").length / billsData.length : 1;
  const goalsProgressRatio = goalsData.length
    ? goalsData.reduce((sum, goal) => sum + Number(goal.current || 0) / Math.max(1, Number(goal.target || 1)), 0) / goalsData.length
    : 0.5;
  const emergencyMonths = expenses ? totalBalance / expenses : totalBalance ? totalBalance / Math.max(1, monthlyIncomeTarget * 0.6) : 0;
  const resilienceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(35 + savingsRate * 0.18 + emergencyMonths * 14 + paidBillsRatio * 18 + goalsProgressRatio * 15)
    )
  );

  return {
    profile,
    activeMonth,
    activeTransactions,
    income,
    expenses,
    savings: income - expenses,
    totalBalance,
    essentials,
    nonEssentials,
    bankBalance,
    cashBalance,
    monthlyIncomeTarget,
    budgetUsedPercent,
    budgetRemaining,
    savingsRate,
    monthLabel: getMonthLabel(activeMonth),
    upcomingBills,
    topGoal,
    riskMeta,
    paidBillsRatio,
    goalsProgressRatio,
    emergencyMonths,
    resilienceScore
  };
};
