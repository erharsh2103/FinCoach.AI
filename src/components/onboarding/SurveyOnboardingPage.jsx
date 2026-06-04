import { useState } from "react";
import { FloatingBg } from "../layout/FloatingBg";
import { GlassCard, inputStyle } from "../widgets/widgetShared";

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

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      fontFamily: "system-ui",
      paddingTop: "40px",
      paddingBottom: "40px"
    }}>
      <FloatingBg />
      <div style={{ width: "min(640px, 92vw)", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "var(--muted)", fontSize: "14px" }}>
          <span>Step {step} of {surveySteps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div style={{ height: "4px", background: "rgba(15,23,42,0.08)", borderRadius: "4px", marginBottom: "30px" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))", borderRadius: "4px", transition: "width 0.5s ease" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "40px", flexWrap: "wrap" }}>
          {["👤", "₹", "💼", "📋"].map((icon, index) => (
            <div key={icon} style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: index + 1 <= step ? "linear-gradient(135deg, var(--primary), var(--accent))" : "rgba(15,23,42,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              border: index + 1 === step ? "2px solid var(--primary)" : "none"
            }}>{icon}</div>
          ))}
        </div>

        <GlassCard style={{ padding: "36px", animation: "fadeUp 0.4s ease" }}>
          <h2 style={{ color: "var(--text)", fontSize: "24px", fontWeight: "700", margin: "0 0 8px" }}>
            {surveySteps[step - 1].icon} {surveySteps[step - 1].title}
          </h2>
          <p style={{ color: "var(--muted)", margin: "0 0 28px", fontSize: "14px" }}>{surveySteps[step - 1].sub}</p>

          {step === 1 && (
            <>
              <input placeholder="Full Name" value={data.name} onChange={e => setData(current => ({ ...current, name: e.target.value }))} style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <input placeholder="Age" type="number" value={data.age} onChange={e => setData(current => ({ ...current, age: e.target.value.replace(/\D/g, "").slice(0, 3) }))} style={inputStyle} />
                <input placeholder="City" value={data.city} onChange={e => setData(current => ({ ...current, city: e.target.value }))} style={inputStyle} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                {["Salaried", "Self-Employed", "Business", "Student"].map(item => (
                  <button key={item} onClick={() => setData(current => ({ ...current, incomeType: item }))} style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    background: data.incomeType === item ? "var(--primary)" : "var(--surface-alt)",
                    color: data.incomeType === item ? "#fff" : "var(--text)",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>{item}</button>
                ))}
              </div>
              <input placeholder="Monthly Income (Rs.)" type="number" value={data.income} onChange={e => setData(current => ({ ...current, income: e.target.value.replace(/[^\d.]/g, "") }))} style={inputStyle} />
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {["Student", "Government", "Private", "Freelancer", "Entrepreneur", "Homemaker"].map(item => (
                  <button key={item} onClick={() => setData(current => ({ ...current, occupation: item }))} style={{
                    padding: "14px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    background: data.occupation === item ? "var(--primary)" : "var(--surface-alt)",
                    color: data.occupation === item ? "#fff" : "var(--text)",
                    fontSize: "14px"
                  }}>{item}</button>
                ))}
              </div>
              <div style={{ marginTop: "18px" }}>
                <div style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "10px" }}>Risk Profile</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {["Conservative", "Balanced", "Growth"].map(item => (
                    <button key={item} onClick={() => setData(current => ({ ...current, riskProfile: item }))} style={{
                      padding: "11px 14px",
                      borderRadius: "12px",
                      border: data.riskProfile === item ? "1px solid var(--primary)" : "1px solid var(--border)",
                      background: data.riskProfile === item ? "rgba(15,118,110,0.10)" : "var(--surface-alt)",
                      color: data.riskProfile === item ? "var(--primary)" : "var(--text)",
                      cursor: "pointer"
                    }}>{item}</button>
                  ))}
                </div>
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
                <GlassCard key={item.key} style={{ padding: "18px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "24px" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text)", fontWeight: "600", marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: "13px" }}>{item.desc}</div>
                  </div>
                  <button onClick={() => setPermissions(current => ({ ...current, [item.key]: !current[item.key] }))} style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    border: "2px solid var(--border)",
                    background: permissions[item.key] ? "var(--primary)" : "transparent",
                    color: "#fff",
                    cursor: "pointer"
                  }}>{permissions[item.key] ? "✓" : ""}</button>
                </GlassCard>
              ))}
            </>
          )}

          {error && <p style={{ color: "var(--danger)", fontSize: "13px", margin: "16px 0 0" }}>{error}</p>}
          <button onClick={handleContinue} disabled={loading} style={{
            width: "100%",
            padding: "16px",
            marginTop: "24px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1
          }}>{loading ? "Saving survey..." : step === 4 ? "Save and Continue" : "Continue"}</button>
        </GlassCard>
      </div>
    </div>
  );
}
