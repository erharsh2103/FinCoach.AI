import React, { useMemo, useState } from "react";
import { GlassCard, inputStyle, formatCurrency, getFinanceSnapshot } from "./widgetShared";
import { apiRequest } from "../../api/api";

// ── command parsing ────────────────────────────────────────────────────────
const CATEGORY_MAP = [
  [/(food|dining|lunch|dinner|breakfast|grocer|restaurant|cafe|coffee|snack|meal|pizza)/i, "Food & Dining"],
  [/(transport|uber|ola|taxi|cab|fuel|petrol|diesel|bus|train|metro|flight|travel)/i, "Transport"],
  [/(shop|clothes|amazon|flipkart|shoe|gadget|electronics|mall)/i, "Shopping"],
  [/(movie|netflix|entertain|game|concert|party|spotify|prime)/i, "Entertainment"],
  [/(bill|electric|water|rent|internet|wifi|recharge|mobile|gas|emi)/i, "Bills"],
  [/(health|medicine|doctor|hospital|pharma|gym|medical|insurance)/i, "Health"]
];
const mapCategory = text => (CATEGORY_MAP.find(([re]) => re.test(text)) || [, "Others"])[1];
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const amt = s => Number(String(s).replace(/[^\d.]/g, ""));
const today = () => new Date().toISOString().slice(0, 10);

function parseCommand(raw) {
  const text = (raw || "").trim();
  if (!text) return null;
  let m;

  if ((m = text.match(/^transfer\s+(?:rs\.?\s*|₹\s*)?([\d,.]+)\s+from\s+(.+?)\s+to\s+(.+)$/i)))
    return { action: "transfer", amount: amt(m[1]), from: m[2].trim(), to: m[3].trim() };

  if ((m = text.match(/^pay\s+(?:the\s+)?(?:bill\s+)?(.+)$/i)))
    return { action: "paybill", name: m[1].trim() };

  if ((m = text.match(/^(?:add\s+|create\s+|new\s+)?goal\s+(.+?)\s+(?:rs\.?\s*|₹\s*)?([\d,.]+)$/i)))
    return { action: "goal", name: cap(m[1].trim().replace(/^["']|["']$/g, "")), target: amt(m[2]) };

  if ((m = text.match(/^(?:add\s+|create\s+|new\s+)?bill\s+(.+?)\s+(?:rs\.?\s*|₹\s*)?([\d,.]+)(?:\s+(\d{4}-\d{2}-\d{2}))?$/i)))
    return { action: "bill", name: cap(m[1].trim()), amount: amt(m[2]), due: m[3] || today() };

  if ((m = text.match(/^(?:add\s+)?(?:income|earned|received|got|salary)\s+(?:rs\.?\s*|₹\s*)?([\d,.]+)\s*(?:from\s+|for\s+)?(.*)$/i)))
    return { action: "income", amount: amt(m[1]), description: cap(m[2].trim()) || "Income" };

  if ((m = text.match(/^(?:add\s+)?(?:expense|spent|spend|paid|buy|bought)\s+(?:rs\.?\s*|₹\s*)?([\d,.]+)\s*(?:on\s+|for\s+|at\s+)?(.*)$/i))) {
    let rest = m[2].trim();
    let accountName = null;
    const am = rest.match(/\s+(?:in|from|using)\s+(.+)$/i);
    if (am) { accountName = am[1].trim(); rest = rest.slice(0, am.index).trim(); }
    return { action: "expense", amount: amt(m[1]), category: mapCategory(rest), description: cap(rest) || mapCategory(rest), accountName };
  }

  return null; // not a recognized command → AI fallback
}

const describe = p => {
  if (!p) return null;
  switch (p.action) {
    case "expense": return `Add expense ${formatCurrency(p.amount)} · ${p.category}`;
    case "income": return `Add income ${formatCurrency(p.amount)} · ${p.description}`;
    case "goal": return `Create goal "${p.name}" — target ${formatCurrency(p.target)}`;
    case "bill": return `Add bill ${p.name} — ${formatCurrency(p.amount)} due ${p.due}`;
    case "paybill": return `Mark bill "${p.name}" as paid`;
    case "transfer": return `Transfer ${formatCurrency(p.amount)} from ${p.from} → ${p.to}`;
    default: return null;
  }
};

const CHIPS = [
  "add expense 500 groceries",
  "add income 20000 salary",
  "add goal Emergency Fund 100000",
  "add bill Electricity 1500",
  "pay bill electricity"
];

// ── component ────────────────────────────────────────────────────────────────
export const Copilot = ({
  profile, accounts = [], transactions = [], goalsData = [], billsData = [],
  onAddTransaction, onAddGoal, onAddBill, onPayBill, onTransfer
}) => {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const preview = useMemo(() => describe(parseCommand(input)), [input]);
  const resolveAccount = name => {
    const q = name.toLowerCase();
    return accounts.find(a => String(a.name || "").toLowerCase().includes(q) || q.includes(String(a.name || "").toLowerCase()));
  };
  const push = entry => setLog(items => [{ id: Date.now() + Math.random(), ...entry }, ...items].slice(0, 20));

  const runCommand = async p => {
    switch (p.action) {
      case "expense": {
        const acc = p.accountName ? resolveAccount(p.accountName) : null;
        const accountId = acc?.id || accounts[0]?.id;
        if (!accountId) return { ok: false, text: "Add an account first." };
        await onAddTransaction({ description: p.description, category: p.category, amount: p.amount, type: "expense", accountId, date: today() });
        return { ok: true, text: `Added expense ${formatCurrency(p.amount)} · ${p.category}${acc ? ` (${acc.name})` : ""}` };
      }
      case "income": {
        const accountId = accounts[0]?.id;
        if (!accountId) return { ok: false, text: "Add an account first." };
        await onAddTransaction({ description: p.description, category: "Income", amount: p.amount, type: "income", accountId, date: today() });
        return { ok: true, text: `Added income ${formatCurrency(p.amount)} · ${p.description}` };
      }
      case "goal":
        await onAddGoal({ name: p.name, target: p.target, current: 0, deadline: "", icon: "Goal" });
        return { ok: true, text: `Created goal "${p.name}" — target ${formatCurrency(p.target)}` };
      case "bill":
        await onAddBill({ name: p.name, amount: p.amount, due: p.due, status: "due" });
        return { ok: true, text: `Added bill ${p.name} — ${formatCurrency(p.amount)} due ${p.due}` };
      case "paybill": {
        const bill = billsData.find(b => b.status !== "paid" && String(b.name || "").toLowerCase().includes(p.name.toLowerCase()));
        if (!bill) return { ok: false, text: `No unpaid bill matching "${p.name}".` };
        await onPayBill(bill.id);
        return { ok: true, text: `Marked "${bill.name}" as paid` };
      }
      case "transfer": {
        if (!onTransfer) return { ok: false, text: "Transfers aren't available here." };
        const from = resolveAccount(p.from);
        const to = resolveAccount(p.to);
        if (!from) return { ok: false, text: `No account matching "${p.from}".` };
        if (!to) return { ok: false, text: `No account matching "${p.to}".` };
        const res = await onTransfer({ fromId: from.id, toId: to.id, amount: p.amount });
        return { ok: !!res?.ok, text: res?.message || (res?.ok ? "Transfer done." : "Transfer failed.") };
      }
      default:
        return { ok: false, text: "Unknown command." };
    }
  };

  const askAI = async question => {
    const snap = getFinanceSnapshot({ profile, accounts, transactions, billsData, goalsData });
    const context = {
      name: profile?.name, monthlyIncome: snap.income, monthlyExpenses: snap.expenses,
      totalBalance: snap.totalBalance, savingsRate: snap.savingsRate, monthLabel: snap.monthLabel,
      goals: goalsData.length, unpaidBills: snap.upcomingBills.length
    };
    const res = await apiRequest("/api/coach/chat", { method: "POST", body: JSON.stringify({ message: question, history: [], context }) });
    return res?.reply || "I couldn't generate a reply. Try a command like `add expense 500 food`.";
  };

  const run = async () => {
    const command = input.trim();
    if (!command || busy) return;
    setBusy(true);
    const parsed = parseCommand(command);
    try {
      if (parsed) {
        const res = await runCommand(parsed);
        push({ type: res.ok ? "ok" : "err", cmd: command, text: res.text });
      } else {
        const reply = await askAI(command);
        push({ type: "ai", cmd: command, text: reply });
      }
      setInput("");
    } catch (error) {
      push({ type: "err", cmd: command, text: error?.message || "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  const icon = t => (t === "ok" ? "✓" : t === "ai" ? "✦" : "✕");
  const tone = t => (t === "ok" ? "var(--success)" : t === "ai" ? "var(--primary)" : "var(--danger)");

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui", maxWidth: "820px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "0 0 6px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>🤖 Copilot</h1>
        <span style={{ background: "rgba(15,185,129,0.12)", color: "var(--primary)", border: "1px solid rgba(15,185,129,0.25)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>Command mode</span>
      </div>
      <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "14px" }}>Type a finance command and I'll run it. Anything else, I'll answer as your AI coach.</p>

      {/* command bar */}
      <GlassCard style={{ padding: "18px", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && run()}
            placeholder='e.g. "add expense 500 groceries" or "how can I save more?"'
            style={{ ...inputStyle, flex: 1, margin: 0 }}
          />
          <button onClick={run} disabled={busy} style={{
            padding: "0 22px", borderRadius: "12px", border: "none", cursor: busy ? "default" : "pointer",
            background: "linear-gradient(135deg,var(--primary),var(--primary-soft))", color: "#fff", fontWeight: 700,
            opacity: busy ? 0.6 : 1, whiteSpace: "nowrap"
          }}>{busy ? "…" : "Run"}</button>
        </div>
        {input.trim() && (
          <p style={{ margin: "10px 2px 0", fontSize: "12px", color: preview ? "var(--primary)" : "var(--muted)" }}>
            {preview ? `→ ${preview}` : "→ Not a command — I'll ask the AI coach."}
          </p>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
          {CHIPS.map(c => (
            <button key={c} onClick={() => setInput(c)} style={{
              background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)",
              padding: "7px 12px", borderRadius: "999px", cursor: "pointer", fontSize: "12px"
            }}>{c}</button>
          ))}
        </div>
      </GlassCard>

      {/* results log */}
      <GlassCard style={{ padding: "18px", marginBottom: "14px", minHeight: "120px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--muted)", fontWeight: 600 }}>Activity</h3>
        {log.length === 0 ? (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>No commands run yet. Try one of the chips above.</p>
        ) : log.map(entry => (
          <div key={entry.id} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#fff", background: tone(entry.type) }}>{icon(entry.type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>{entry.cmd}</p>
              <p style={{ margin: "2px 0 0", fontSize: "14px", lineHeight: 1.5 }}>{entry.text}</p>
            </div>
          </div>
        ))}
      </GlassCard>

      {/* cheatsheet */}
      <GlassCard style={{ padding: "18px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--muted)", fontWeight: 600 }}>Commands</h3>
        {[
          ["add expense <amount> <what> [in <account>]", "Logs a spend, auto-categorised"],
          ["add income <amount> <source>", "Logs income to your first account"],
          ["add goal <name> <target>", "Creates a savings goal"],
          ["add bill <name> <amount> [YYYY-MM-DD]", "Adds a bill / reminder"],
          ["pay bill <name>", "Marks a matching unpaid bill paid"],
          ["transfer <amount> from <acct> to <acct>", "Moves money between accounts"]
        ].map(([cmd, desc]) => (
          <div key={cmd} style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "8px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
            <code style={{ fontSize: "13px", color: "var(--text)" }}>{cmd}</code>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{desc}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
};
