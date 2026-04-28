import React, { useState } from "react";
import { GlassCard, inputStyle, formatCurrency } from "./widgetShared";

export const GoalsScreen = ({ goals = [], onAddGoal, onFundGoal, onDeleteGoal }) => {
  const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", icon: "Goal" });
  const [fund, setFund] = useState({});

  const submit = async () => {
    if (!form.name.trim() || !form.target) return;
    await onAddGoal?.(form);
    setForm({ name: "", target: "", current: "", deadline: "", icon: "Goal" });
  };

  return (
    <div style={{ color: "#fff", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Goals</h1>
      <GlassCard style={{ padding: "20px", marginBottom: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Goal name" style={inputStyle} />
          <input value={form.target} onChange={e => setForm({ ...form, target: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Target" style={inputStyle} />
          <input value={form.current} onChange={e => setForm({ ...form, current: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Saved so far" style={inputStyle} />
          <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={inputStyle} />
        </div>
        <button onClick={submit} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2563EB,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
          Add Goal
        </button>
      </GlassCard>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((Number(goal.current || 0) / Math.max(1, Number(goal.target || 1))) * 100));
          return (
            <GlassCard key={goal.id} style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong>{goal.name}</strong>
                <span>{pct}%</span>
              </div>
              <div style={{ height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", marginBottom: "10px" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 12px" }}>
                {formatCurrency(goal.current)} of {formatCurrency(goal.target)} {goal.deadline ? `by ${goal.deadline}` : ""}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={fund[goal.id] || ""} onChange={e => setFund({ ...fund, [goal.id]: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Add funds" style={{ ...inputStyle, padding: "10px" }} />
                <button onClick={() => onFundGoal?.(goal.id, fund[goal.id])} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "#2563EB", color: "#fff", cursor: "pointer" }}>
                  Fund
                </button>
                <button onClick={() => onDeleteGoal?.(goal.id)} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.16)", color: "#F87171", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
