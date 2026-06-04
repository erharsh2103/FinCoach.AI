import { useState } from "react";
import { GlassCard, inputStyle, formatCurrency, getFinanceSnapshot } from "../widgets/widgetShared";
import { apiRequest } from "../../api/api";

export function AICoach({ profile, accounts, transactions, billsData, goalsData }) {
  // Use the same snapshot logic the Dashboard uses — picks the most recent month
  // that actually has transactions instead of hardcoding the current calendar month.
  const snap = getFinanceSnapshot({ profile, accounts, transactions, billsData, goalsData });

  const {
    income: monthlyIncome,
    expenses: monthlyExpenses,
    totalBalance,
    budgetUsedPercent: budgetUsed,
    savingsRate,
    monthLabel,
    upcomingBills,
    topGoal,
    essentials,
    nonEssentials,
    bankBalance,
    cashBalance,
    budgetRemaining
  } = snap;

  const unpaidBills = upcomingBills; // already filtered to unpaid in getFinanceSnapshot

  const byCategory = transactions
    .filter(tx => tx.type === "expense")
    .reduce((acc, tx) => {
      const cat = tx.category || "Others";
      acc[cat] = (acc[cat] || 0) + Number(tx.amount || 0);
      return acc;
    }, {});

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat} (${formatCurrency(amt)})`)
    .join(", ");

  const starterText = monthlyIncome
    ? `Hello! In ${monthLabel} you spent ${formatCurrency(monthlyExpenses)} out of ${formatCurrency(monthlyIncome)} — budget usage ${budgetUsed}%, ${formatCurrency(budgetRemaining)} remaining. Ask me anything about your finances.`
    : transactions.length
      ? `Hello! I can see ${transactions.length} transactions across ${accounts.length} accounts (total balance ${formatCurrency(totalBalance)}). Add your monthly income in Profile to unlock budget coaching.`
      : "Hello! Add accounts and transactions first, then I can coach you from your real financial data.";

  const [messages, setMessages] = useState([{ role: "ai", text: starterText }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const buildCoachReply = question => {
    const text = String(question || "").toLowerCase();

    if (!transactions.length && !accounts.length) {
      return "There is no finance data yet. Add accounts and transactions first — then I can give you real budget and savings guidance.";
    }

    if (text.includes("spend") || text.includes("budget") || text.includes("expense")) {
      if (!monthlyIncome) {
        return `In ${monthLabel} you logged ${formatCurrency(monthlyExpenses)} in expenses.${topCategories ? ` Top categories: ${topCategories}.` : ""} Set your monthly income in Profile for a full budget breakdown.`;
      }
      return `In ${monthLabel} you spent ${formatCurrency(monthlyExpenses)} of ${formatCurrency(monthlyIncome)} — that's ${budgetUsed}% of your budget, with ${formatCurrency(budgetRemaining)} left.${topCategories ? ` Your biggest spend categories are ${topCategories}.` : ""}`;
    }

    if (text.includes("categor") || text.includes("where")) {
      return topCategories
        ? `Your top expense categories are: ${topCategories}. Essentials make up ${formatCurrency(essentials)} and non-essentials ${formatCurrency(nonEssentials)}.`
        : "No expense categories found yet. Add some transactions to see where your money goes.";
    }

    if (text.includes("save") || text.includes("saving")) {
      return `Your savings rate is ${savingsRate}% in ${monthLabel}. Total balance across all accounts is ${formatCurrency(totalBalance)} (bank: ${formatCurrency(bankBalance)}, cash: ${formatCurrency(cashBalance)}). A healthy target is 20%+ — automate a fixed transfer on payday to hit it.`;
    }

    if (text.includes("invest")) {
      const risk = profile?.riskProfile || "Balanced";
      return `Your risk profile is ${risk}. Based on ${monthLabel}, your investable surplus is about ${formatCurrency(Math.max(0, monthlyIncome - monthlyExpenses))}. Keep 3–6 months of expenses (${formatCurrency(monthlyExpenses * 4)}) in an emergency fund before increasing long-term investing. *Not financial advice — consult a SEBI-registered advisor for specific investments.*`;
    }

    if (text.includes("goal")) {
      if (!goalsData.length) return "You have no savings goals yet. Add a goal with a target amount and deadline — I can help you pace monthly contributions.";
      const goalLines = goalsData.map(g => {
        const pct = Math.round((Number(g.current || 0) / Math.max(1, Number(g.target || 1))) * 100);
        return `${g.name}: ${pct}% (${formatCurrency(g.current)} of ${formatCurrency(g.target)})`;
      }).join("; ");
      return `Your goals — ${goalLines}. ${topGoal ? `Focus on "${topGoal.name}" — it's your most progressed.` : ""}`;
    }

    if (text.includes("bill")) {
      return unpaidBills.length
        ? `You have ${unpaidBills.length} unpaid bill${unpaidBills.length === 1 ? "" : "s"} totalling ${formatCurrency(unpaidBills.reduce((s, b) => s + Number(b.amount || 0), 0))}. Next up: ${unpaidBills[0].name} — ${formatCurrency(unpaidBills[0].amount)} due ${unpaidBills[0].due}.`
        : "No unpaid bills right now — you're all clear!";
    }

    if (text.includes("balance") || text.includes("account")) {
      return `Total balance: ${formatCurrency(totalBalance)} across ${accounts.length} account${accounts.length !== 1 ? "s" : ""} (bank: ${formatCurrency(bankBalance)}, cash: ${formatCurrency(cashBalance)}).`;
    }

    return `In ${monthLabel}: income ${formatCurrency(monthlyIncome)}, expenses ${formatCurrency(monthlyExpenses)}, savings rate ${savingsRate}%, total balance ${formatCurrency(totalBalance)}. I can see ${transactions.length} transactions, ${goalsData.length} goals, and ${unpaidBills.length} unpaid bills. Ask about spending, savings, goals, bills, or investments.`;
  };

  const send = async () => {
    if (!input.trim() || typing) return;
    const userMsg = input.trim();
    const history = messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setTyping(true);

    const context = {
      name: profile?.name,
      monthLabel,
      monthlyIncome,
      monthlyExpenses,
      budgetUsed,
      remaining: budgetRemaining,
      totalBalance,
      bankBalance,
      cashBalance,
      savingsRate,
      essentials,
      nonEssentials,
      topCategories,
      riskProfile: profile?.riskProfile,
      goals: goalsData.map(g => ({
        name: g.name,
        current: g.current,
        target: g.target,
        pct: Math.round((Number(g.current || 0) / Math.max(1, Number(g.target || 1))) * 100)
      })),
      unpaidBills: unpaidBills.map(b => ({ name: b.name, due: b.due, amount: b.amount })),
      transactionsCount: transactions.length,
      accountsCount: accounts.length
    };

    try {
      const res = await apiRequest("/api/coach/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg, history, context })
      });
      const reply = (res && res.reply) ? res.reply : buildCoachReply(userMsg);
      setMessages(m => [...m, { role: "ai", text: reply }]);
    } catch (error) {
      setMessages(m => [...m, { role: "ai", text: buildCoachReply(userMsg) }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "0 0 18px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>🧠 AI Financial Coach</h1>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: "rgba(15,118,110,0.10)", color: "var(--primary)",
          border: "1px solid rgba(15,118,110,0.25)", padding: "4px 10px",
          borderRadius: "999px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.02em"
        }}>✦ Powered by Claude</span>
      </div>

      <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["Where am I spending?", "Budget check", "Savings rate", "Goal plan", "Bill reminders", "Investment advice"].map(t => (
            <button key={t} onClick={() => setInput(t)} style={{
              background: "rgba(15,118,110,0.10)", border: "1px solid rgba(15,118,110,0.25)",
              color: "var(--primary)", padding: "8px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px"
            }}>{t}</button>
          ))}
        </div>
      </GlassCard>

      <GlassCard style={{ padding: "20px", marginBottom: "16px", minHeight: "350px", maxHeight: "400px", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            marginBottom: "16px", animation: "fadeUp 0.3s ease"
          }}>
            {m.role === "ai" && (
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", fontSize: "16px"
              }}>✦</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? "linear-gradient(135deg, var(--primary), var(--accent))" : "var(--surface-alt)",
              color: m.role === "user" ? "#fff" : "var(--text)", fontSize: "14px", lineHeight: "1.6"
            }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
            }}>✦</div>
            <div style={{ background: "var(--surface-alt)", padding: "12px 16px", borderRadius: "16px", display: "flex", gap: "4px" }}>
              {[0,1,2].map(d => <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--muted)", animation: `typing 1s ${d*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
      </GlassCard>

      <div style={{ display: "flex", gap: "10px" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask your AI coach..." style={{...inputStyle, flex: 1, margin: 0}} />
        <button onClick={send} style={{
          padding: "14px 20px", borderRadius: "12px", border: "none",
          background: "linear-gradient(135deg, var(--primary), var(--accent))",
          color: "#fff", cursor: "pointer", fontSize: "18px"
        }}>➤</button>
      </div>
    </div>
  );
}
