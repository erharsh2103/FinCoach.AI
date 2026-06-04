import React, { useState } from "react";
import { FeatureHubPage, GlassCard, inputStyle, formatCurrency } from "./widgetShared";

export const EMICalc = () => {
  const [loan, setLoan] = useState(0);
  const [rate, setRate] = useState(0);
  const [months, setMonths] = useState(12);
  const monthlyRate = rate / 12 / 100;
  const emi = monthlyRate ? loan * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1) : loan / months;
  const breakdown = [
    ["Monthly EMI", emi],
    ["Total Interest", emi * months - loan],
    ["Total Payable", emi * months]
  ];

  return (
    <FeatureHubPage title="EMI Calculator" subtitle="Estimate loan EMI, total interest, and total repayment.">
      <GlassCard style={{ padding: "22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <input value={loan} onChange={e => setLoan(Number(e.target.value.replace(/\D/g, "")) || 0)} style={inputStyle} />
          <input value={rate} onChange={e => setRate(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} style={inputStyle} />
          <input value={months} onChange={e => setMonths(Number(e.target.value.replace(/\D/g, "")) || 1)} style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "18px" }}>
          {breakdown.map(([label, value]) => (
            <div key={label}>
              <p style={{ color: "var(--muted)", margin: "0 0 6px" }}>{label}</p>
              <strong style={{ fontSize: "24px" }}>{formatCurrency(value)}</strong>
            </div>
          ))}
        </div>
      </GlassCard>
    </FeatureHubPage>
  );
};
