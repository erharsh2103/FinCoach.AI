import { useState } from "react";
import { FloatingBg } from "../layout/FloatingBg";
import { GlassCard } from "../widgets/widgetShared";

// Tokens with literal fallbacks so this first screen always renders correctly,
// even if the theme CSS is slow/cached.
const T = {
  primary: "var(--primary, #0FB981)",
  primarySoft: "var(--primary-soft, #34D39E)",
  text: "var(--text, #16201B)",
  muted: "var(--muted, #5f6b64)",
  surfaceAlt: "var(--surface-alt, #eef2f0)",
  border: "var(--border, #cdd6d1)",
  danger: "var(--danger, #F2545B)"
};

const fieldInput = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "6px",
  background: "#ffffff",
  border: `1.5px solid ${T.border}`,
  borderRadius: "12px",
  padding: "13px 14px",
  fontSize: "15px",
  color: T.text,
  outline: "none",
  fontFamily: "system-ui"
};
const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: T.text };

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: "14px" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function SurveyOnboardingPage({ initialProfile, onDone }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(() => ({
    name: initialProfile?.name || "",
    age: initialProfile?.age ?? "",
    city: initialProfile?.city || "",
    incomeType: initialProfile?.incomeType || "",
    income: initialProfile?.monthlyIncome ? String(initialProfile.monthlyIncome) : "",
    occupation: initialProfile?.occupation || "",
    riskProfile: initialProfile?.riskProfile || ""
  }));
  const [permissions, setPermissions] = useState(() => ({
    sms: Boolean(initialProfile?.permissions?.sms),
    bank: Boolean(initialProfile?.permissions?.bank),
    notifs: Boolean(initialProfile?.permissions?.notifs)
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const surveySteps = [
    { icon: "👋", title: "Let's get to know you", sub: "Set up the basics for your finance profile." },
    { icon: "💰", title: "Income Details", sub: "We'll use this to tailor budgeting and plan suggestions." },
    { icon: "💼", title: "Work and risk profile", sub: "This helps us shape better coaching and investment ideas." },
    { icon: "🔐", title: "Permissions", sub: "Choose what FinCoach can use for smarter automations." }
  ];

  const progress = (step / surveySteps.length) * 100;

  const handleContinue = async () => {
    setError("");

    if (step === 1) {
      if (!String(data.name || "").trim()) return setError("Please enter your full name.");
      const age = Number(data.age);
      if (!Number.isInteger(age) || age < 13 || age > 100) return setError("Please enter a valid age between 13 and 100.");
      if (!String(data.city || "").trim()) return setError("Please enter your city.");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!data.incomeType) return setError("Please select your income type.");
      const monthlyIncome = Number(data.income);
      if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) return setError("Please enter a valid monthly income.");
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!data.occupation) return setError("Please select your occupation.");
      if (!data.riskProfile) return setError("Please choose your risk profile.");
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      await onDone({
        name: String(data.name || "").trim(),
        age: Number(data.age),
        city: String(data.city || "").trim(),
        incomeType: data.incomeType,
        monthlyIncome: Number(data.income),
        occupation: data.occupation,
        riskProfile: data.riskProfile,
        permissions
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save your survey right now.");
    } finally {
      setLoading(false);
    }
  };

  const chip = (selected) => ({
    padding: "12px",
    borderRadius: "12px",
    border: selected ? `1.5px solid ${T.primary}` : `1.5px solid ${T.border}`,
    cursor: "pointer",
    background: selected ? T.primary : "#ffffff",
    color: selected ? "#fff" : T.text,
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "system-ui"
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #ECF1EF)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      fontFamily: "system-ui",
      padding: "40px 16px"
    }}>
      <FloatingBg />
      <div style={{ width: "min(640px, 92vw)", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: T.muted, fontSize: "14px" }}>
          <span>Step {step} of {surveySteps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: "6px", background: "rgba(20,40,32,0.10)", borderRadius: "4px", marginBottom: "28px" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${T.primary}, ${T.primarySoft})`, borderRadius: "4px", transition: "width 0.5s ease" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
          {["👤", "₹", "💼", "📋"].map((icon, index) => {
            const active = index + 1 <= step;
            return (
              <div key={icon} style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: active ? `linear-gradient(135deg, ${T.primary}, ${T.primarySoft})` : "#e7ecea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                color: "#fff",
                border: index + 1 === step ? `2px solid ${T.primary}` : "2px solid transparent"
              }}>{icon}</div>
            );
          })}
        </div>

        <GlassCard style={{ padding: "32px", animation: "fadeUp 0.4s ease" }}>
          <h2 style={{ color: T.text, fontSize: "23px", fontWeight: "800", margin: "0 0 6px" }}>
            {surveySteps[step - 1].icon} {surveySteps[step - 1].title}
          </h2>
          <p style={{ color: T.muted, margin: "0 0 24px", fontSize: "14px" }}>{surveySteps[step - 1].sub}</p>

          {step === 1 && (
            <>
              <Field label="Full name">
                <input placeholder="e.g. Harsh Aggarwal" value={data.name} onChange={e => setData(c => ({ ...c, name: e.target.value }))} style={fieldInput} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Field label="Age">
                  <input placeholder="e.g. 21" type="number" value={data.age} onChange={e => setData(c => ({ ...c, age: e.target.value.replace(/\D/g, "").slice(0, 3) }))} style={fieldInput} />
                </Field>
                <Field label="City">
                  <input placeholder="e.g. New Delhi" value={data.city} onChange={e => setData(c => ({ ...c, city: e.target.value }))} style={fieldInput} />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <span style={labelStyle}>Income type</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", margin: "8px 0 18px" }}>
                {["Salaried", "Self-Employed", "Business", "Student"].map(item => (
                  <button key={item} onClick={() => setData(c => ({ ...c, incomeType: item }))} style={chip(data.incomeType === item)}>{item}</button>
                ))}
              </div>
              <Field label="Monthly income (₹)">
                <input placeholder="e.g. 50000" type="number" value={data.income} onChange={e => setData(c => ({ ...c, income: e.target.value.replace(/[^\d.]/g, "") }))} style={fieldInput} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <span style={labelStyle}>Occupation</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "8px 0 18px" }}>
                {["Student", "Government", "Private", "Freelancer", "Entrepreneur", "Homemaker"].map(item => (
                  <button key={item} onClick={() => setData(c => ({ ...c, occupation: item }))} style={chip(data.occupation === item)}>{item}</button>
                ))}
              </div>
              <span style={labelStyle}>Risk profile</span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                {["Conservative", "Balanced", "Growth"].map(item => (
                  <button key={item} onClick={() => setData(c => ({ ...c, riskProfile: item }))} style={chip(data.riskProfile === item)}>{item}</button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              {[
                { icon: "📱", title: "Read Financial SMS", desc: "Scan only bank and payment alerts for transaction detection.", key: "sms" },
                { icon: "🏦", title: "Bank Statement Analysis", desc: "Use patterns to improve coaching and spending insights.", key: "bank" },
                { icon: "🔔", title: "Smart Notifications", desc: "Send reminders for bills, goals, and payment activity.", key: "notifs" }
              ].map(item => (
                <div key={item.key} style={{ padding: "16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "14px", background: "#fff", border: `1.5px solid ${T.border}`, borderRadius: "14px" }}>
                  <span style={{ fontSize: "24px" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.text, fontWeight: "600", marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ color: T.muted, fontSize: "13px" }}>{item.desc}</div>
                  </div>
                  <button onClick={() => setPermissions(c => ({ ...c, [item.key]: !c[item.key] }))} style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: `2px solid ${permissions[item.key] ? T.primary : T.border}`,
                    background: permissions[item.key] ? T.primary : "#fff",
                    color: "#fff",
                    cursor: "pointer",
                    flexShrink: 0,
                    fontWeight: 800
                  }}>{permissions[item.key] ? "✓" : ""}</button>
                </div>
              ))}
            </>
          )}

          {error && <p style={{ color: T.danger, fontSize: "13px", margin: "16px 0 0", fontWeight: 600 }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            {step > 1 && (
              <button onClick={() => { setError(""); setStep(s => s - 1); }} disabled={loading} style={{
                padding: "15px 20px",
                borderRadius: "14px",
                border: `1.5px solid ${T.border}`,
                background: "#fff",
                color: T.text,
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "system-ui"
              }}>← Back</button>
            )}
            <button onClick={handleContinue} disabled={loading} style={{
              flex: 1,
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              background: `linear-gradient(135deg, ${T.primary}, ${T.primarySoft})`,
              color: "#fff",
              fontSize: "16px",
              fontWeight: "800",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
              fontFamily: "system-ui"
            }}>{loading ? "Saving…" : step === 4 ? "Finish & Continue" : "Continue →"}</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
