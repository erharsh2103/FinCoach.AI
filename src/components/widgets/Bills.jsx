import React, { useState } from "react";
import { GlassCard, inputStyle, formatCurrency } from "./widgetShared";

export const Bills = ({ bills = [], onAddBill, onPayBill, onDeleteBill }) => {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    due: new Date().toISOString().slice(0, 10),
    status: "due"
  });

  const submit = async () => {
    if (!form.name.trim() || !form.amount) return;
    await onAddBill?.(form);
    setForm({ name: "", amount: "", due: new Date().toISOString().slice(0, 10), status: "due" });
  };

  const sortedBills = [...bills].sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Bills & Reminders</h1>
      <GlassCard style={{ padding: "20px", marginBottom: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bill name" style={inputStyle} />
          <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Amount" style={inputStyle} />
          <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} style={inputStyle} />
        </div>
        <button onClick={submit} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,var(--primary),var(--accent))", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
          Add Bill
        </button>
      </GlassCard>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
        {sortedBills.map(bill => (
          <GlassCard key={bill.id} style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
              <strong>{bill.name}</strong>
              <span style={{ color: bill.status === "overdue" ? "#EF4444" : bill.status === "paid" ? "var(--success)" : "#FBBF24", fontSize: "12px", textTransform: "capitalize" }}>
                {bill.status || "due"}
              </span>
            </div>
            <p style={{ color: "var(--muted)", margin: "8px 0" }}>Due: {bill.due}</p>
            <strong style={{ fontSize: "22px" }}>{formatCurrency(bill.amount)}</strong>
            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => onPayBill?.(bill.id)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "rgba(5,150,105,0.12)", color: "var(--success)", cursor: "pointer" }}>
                Paid
              </button>
              <button onClick={() => onDeleteBill?.(bill.id)} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.16)", color: "#EF4444", cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};



