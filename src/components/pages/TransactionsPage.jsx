import { useState } from "react";
import { GlassCard, inputStyle, formatCurrency } from "../widgets/widgetShared";

export function TransactionsPage({ transactions, accounts, onAddTransaction, onDeleteTransaction }) {
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    description: "",
    category: "Food & Dining",
    amount: "",
    type: "expense",
    accountId: accounts[0]?.id || "",
    date: new Date().toISOString().slice(0, 10)
  });
  const [error, setError] = useState("");
  const categories = ["Food & Dining", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Income", "Others"];
  const visible = transactions.filter(tx => filter === "all" || tx.type === filter);
  const income = transactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expenses = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const submit = async () => {
    try {
      await onAddTransaction(form);
      setForm(prev => ({ ...prev, description: "", amount: "" }));
      setError("");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Transactions</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        {[["Income", income, "var(--success)"], ["Expenses", expenses, "var(--danger)"], ["Net", income - expenses, "var(--accent)"]].map(([label, value, color]) => (
          <GlassCard key={label} style={{ padding: "18px" }}>
            <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: "13px" }}>{label}</p>
            <strong style={{ fontSize: "24px", color }}>{formatCurrency(value)}</strong>
          </GlassCard>
        ))}
      </div>

      <GlassCard style={{ padding: "20px", marginBottom: "18px" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: "19px" }}>Add Transaction</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? "Income" : form.category })} style={inputStyle}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" style={inputStyle} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {categories.map(category => <option key={category}>{category}</option>)}
          </select>
          <input inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Amount" style={inputStyle} />
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>}
        <button onClick={submit} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,var(--primary),var(--accent))", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Save Transaction</button>
      </GlassCard>

      <GlassCard style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "19px" }}>History</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "income", "expense"].map(item => (
              <button key={item} onClick={() => setFilter(item)} style={{ padding: "8px 12px", borderRadius: "12px", border: "none", color: filter === item ? "#fff" : "var(--text)", background: filter === item ? "var(--primary)" : "var(--surface-alt)", cursor: "pointer" }}>{item}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "660px", borderCollapse: "collapse" }}>
            <thead><tr>{["Date", "Type", "Category", "Description", "Amount", ""].map(h => <th key={h} style={{ textAlign: "left", padding: "10px", color: "var(--accent)", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {visible.map(tx => (
                <tr key={tx.id}>
                  <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{tx.date}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{tx.type}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{tx.category || "-"}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}>{tx.description}</td>
                  <td style={{ padding: "10px", color: tx.type === "income" ? "var(--success)" : "var(--danger)", fontWeight: 800, borderBottom: "1px solid var(--surface-alt)" }}>{tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid var(--surface-alt)" }}><button onClick={() => onDeleteTransaction(tx.id)} style={{ background: "rgba(239,68,68,0.16)", color: "var(--danger)", border: "none", borderRadius: "8px", padding: "7px 10px", cursor: "pointer" }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
