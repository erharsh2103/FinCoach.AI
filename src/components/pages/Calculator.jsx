import { useState } from "react";
import { GlassCard, inputStyle, formatCurrency } from "../widgets/widgetShared";

const fmt = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString()}`;
};

// ── Investment (SIP / lumpsum growth) ──────────────────────────────────────
function InvestmentCalc() {
  const [mode, setMode] = useState("years");
  const [initial, setInitial] = useState(10000);
  const [sip, setSip] = useState(5000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const [tax, setTax] = useState(false);
  const [inflation, setInflation] = useState(false);

  const riskLabel = rate <= 5 ? { label: "Conservative", color: "var(--primary)" }
    : rate <= 8 ? { label: "Moderate", color: "var(--accent)" }
    : rate <= 12 ? { label: "Aggressive", color: "#F59E0B" }
    : rate <= 15 ? { label: "Very Aggressive", color: "#EF4444" }
    : { label: "Ultra Aggressive", color: "#8B5CF6" };

  const n = 12, t = years, r = rate / 100;
  const rn = r / n, nt = n * t;
  let fv = initial * Math.pow(1 + rn, nt) + sip * ((Math.pow(1 + rn, nt) - 1) / rn);
  const totalInvested = initial + sip * 12 * t;
  let interestEarned = fv - totalInvested;
  if (tax) { interestEarned *= 0.9; fv = totalInvested + interestEarned; }
  if (inflation) { fv = fv / Math.pow(1.06, t); }
  const cagr = (Math.pow(fv / initial, 1 / t) - 1) * 100;

  const chartData = Array.from({ length: years }, (_, i) => {
    const nYr = n * (i + 1);
    return initial * Math.pow(1 + rn, nYr) + sip * ((Math.pow(1 + rn, nYr) - 1) / rn);
  });
  const maxVal = Math.max(...chartData);

  return (
    <>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[["years", "By Years"], ["age", "By Age"], ["goal", "Goal-Based"]].map(([m, l]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px",
            background: mode === m ? "linear-gradient(135deg, var(--primary), var(--primary-soft))" : "var(--surface-alt)",
            color: mode === m ? "#fff" : "var(--text)", fontWeight: mode === m ? "700" : "400"
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <GlassCard style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "15px", color: "var(--muted)" }}>Investment Inputs</h3>
          {[
            { label: "Initial Investment (₹)", val: initial, set: setInitial, min: 0, max: 1000000, step: 1000, unit: "₹" },
            { label: "Monthly SIP (₹)", val: sip, set: setSip, min: 0, max: 100000, step: 500, unit: "₹" },
            { label: `Timeframe (${years} years)`, val: years, set: setYears, min: 1, max: 40, step: 1, unit: "yrs" }
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", color: "var(--muted)" }}>{f.label}</label>
                <span style={{ fontWeight: "700", color: "var(--primary)", fontSize: "14px" }}>
                  {f.unit === "₹" ? `₹${Number(f.val).toLocaleString()}` : `${f.val} yrs`}
                </span>
              </div>
              <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                onChange={e => f.set(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--primary)" }} />
            </div>
          ))}

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", color: "var(--muted)" }}>Expected Return</label>
              <span style={{ fontWeight: "700", color: riskLabel.color, fontSize: "14px" }}>{rate}% — {riskLabel.label}</span>
            </div>
            <input type="range" min={1} max={20} step={0.5} value={rate}
              onChange={e => setRate(Number(e.target.value))} style={{ width: "100%", accentColor: riskLabel.color }} />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {[["Tax (10% LTCG)", tax, setTax], ["Inflation (6%)", inflation, setInflation]].map(([l, v, s], i) => (
              <button key={i} onClick={() => s(!v)} style={{
                flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer",
                background: v ? "linear-gradient(135deg, var(--primary), var(--primary-soft))" : "var(--surface-alt)",
                color: v ? "#fff" : "var(--text)", fontSize: "12px", fontWeight: "600"
              }}>{l}</button>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "var(--muted)" }}>Projection</h3>
          <div style={{ height: "120px", display: "flex", alignItems: "flex-end", gap: "4px", marginBottom: "20px" }}>
            {chartData.map((v, i) => (
              <div key={i} style={{
                flex: 1, background: "linear-gradient(0deg, var(--primary), var(--primary-soft))",
                borderRadius: "3px 3px 0 0", opacity: 0.7 + (i / chartData.length) * 0.3,
                height: `${(v / maxVal) * 100}%`, transition: "height 0.5s ease", minHeight: "4px"
              }} title={fmt(v)} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "Final Value", val: fmt(fv), color: "var(--primary)" },
              { label: "Total Invested", val: fmt(totalInvested), color: "var(--text)" },
              { label: "Interest Earned", val: fmt(interestEarned), color: "#F59E0B" },
              { label: "CAGR", val: `${Math.abs(cagr).toFixed(1)}%`, color: "var(--success)" }
            ].map((r, i) => (
              <div key={i} style={{ background: "var(--surface-alt)", padding: "14px", borderRadius: "12px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "var(--muted)" }}>{r.label}</p>
                <p style={{ margin: 0, fontWeight: "800", fontSize: "16px", color: r.color }}>{r.val}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

// ── EMI (loan repayment) ───────────────────────────────────────────────────
function EmiCalc() {
  const [loan, setLoan] = useState(500000);
  const [rate, setRate] = useState(9);
  const [months, setMonths] = useState(60);
  const monthlyRate = rate / 12 / 100;
  const emi = monthlyRate
    ? loan * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1)
    : loan / months;
  const totalPayable = emi * months;
  const totalInterest = totalPayable - loan;
  const interestShare = totalPayable ? Math.round((totalInterest / totalPayable) * 100) : 0;

  const fields = [
    { label: "Loan amount (₹)", val: loan, set: v => setLoan(Number(v.replace(/[^\d]/g, "")) || 0) },
    { label: "Interest rate (% p.a.)", val: rate, set: v => setRate(Number(v.replace(/[^\d.]/g, "")) || 0) },
    { label: "Tenure (months)", val: months, set: v => setMonths(Number(v.replace(/[^\d]/g, "")) || 1) }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
      <GlassCard style={{ padding: "24px" }}>
        <h3 style={{ margin: "0 0 18px", fontSize: "15px", color: "var(--muted)" }}>Loan Details</h3>
        {fields.map(f => (
          <label key={f.label} style={{ display: "block", marginBottom: "14px", color: "var(--muted)", fontSize: "13px" }}>
            {f.label}
            <input value={f.val} onChange={e => f.set(e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
          </label>
        ))}
      </GlassCard>

      <GlassCard style={{ padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "var(--muted)" }}>Repayment</h3>
        <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "13px" }}>Monthly EMI</p>
        <strong style={{ fontSize: "30px" }}>{formatCurrency(Math.round(emi))}</strong>
        <div style={{ display: "flex", gap: "8px", margin: "18px 0" }}>
          <div style={{ height: "10px", borderRadius: "999px", background: "var(--primary)", flex: Math.max(100 - interestShare, 4) }} title="Principal" />
          <div style={{ height: "10px", borderRadius: "999px", background: "var(--accent)", flex: Math.max(interestShare, 4) }} title="Interest" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            ["Principal", loan, "var(--primary)"],
            ["Total Interest", totalInterest, "var(--accent)"],
            ["Total Payable", totalPayable, "var(--text)"],
            ["Interest share", interestShare, "#F59E0B"]
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: "var(--surface-alt)", padding: "14px", borderRadius: "12px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: "var(--muted)" }}>{label}</p>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "16px", color }}>{label === "Interest share" ? `${val}%` : formatCurrency(Math.round(val))}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function Calculator() {
  const [tab, setTab] = useState("investment");
  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: "800" }}>🔢 Calculator</h1>
      <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "14px" }}>Investment growth and loan EMI in one place.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "22px" }}>
        {[["investment", "Investment"], ["emi", "EMI"]].map(([id, label]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "10px 20px", borderRadius: "999px", border: "1px solid var(--glass-border)", cursor: "pointer",
              fontSize: "14px", fontWeight: active ? 700 : 500,
              background: active ? "var(--primary)" : "var(--glass-bg)", color: active ? "#fff" : "var(--text)",
              backdropFilter: "blur(var(--glass-blur))", WebkitBackdropFilter: "blur(var(--glass-blur))"
            }}>{label}</button>
          );
        })}
      </div>

      {tab === "investment" ? <InvestmentCalc /> : <EmiCalc />}
    </div>
  );
}
