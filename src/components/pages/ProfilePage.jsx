import { useState, useEffect } from "react";
import { GlassCard, inputStyle, formatCurrency } from "../widgets/widgetShared";
import { defaultProfile } from "../../constants";

export function ProfilePage({ profile, onSaveProfile, statusMessage }) {
  const [form, setForm] = useState(profile || defaultProfile);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm(profile || defaultProfile);
  }, [profile]);

  const updateField = (field, value) => {
    setSuccess("");
    setError("");
    setForm(current => ({ ...current, [field]: value }));
  };

  const save = async () => {
    const ageValue = form.age === "" || form.age === null || form.age === undefined ? null : Number(form.age);
    const nextProfile = {
      ...form,
      name: String(form.name || "").trim(),
      phone: String(form.phone || "").replace(/\D/g, "").slice(0, 10),
      age: ageValue,
      email: String(form.email || "").trim(),
      city: String(form.city || "").trim(),
      incomeType: String(form.incomeType || "").trim(),
      monthlyIncome: Number(form.monthlyIncome || 0),
      riskProfile: String(form.riskProfile || "").trim(),
      occupation: String(form.occupation || "").trim(),
      permissions: {
        sms: Boolean(form.permissions?.sms),
        bank: Boolean(form.permissions?.bank),
        notifs: Boolean(form.permissions?.notifs)
      }
    };

    if (!nextProfile.name) return setError("Name is required.");
    if (!/^\d{10}$/.test(nextProfile.phone)) return setError("Phone number must be exactly 10 digits.");
    if (nextProfile.age !== null && (!Number.isInteger(nextProfile.age) || nextProfile.age < 13 || nextProfile.age > 100)) return setError("Age must be between 13 and 100.");
    if (nextProfile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextProfile.email)) return setError("Enter a valid email address.");
    if (!nextProfile.city) return setError("City is required.");
    if (!nextProfile.incomeType) return setError("Income type is required.");
    if (!Number.isFinite(nextProfile.monthlyIncome) || nextProfile.monthlyIncome < 0) return setError("Monthly income must be a valid non-negative number.");
    if (!nextProfile.occupation) return setError("Occupation is required.");
    if (!nextProfile.riskProfile) return setError("Risk profile is required.");

    await onSaveProfile(nextProfile);
    setSuccess("Profile saved.");
  };

  return (
    <div style={{ color: "var(--text)", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "30px", fontWeight: "800", flexShrink: 0, color: "#fff"
        }}>{(form.name || "U").slice(0, 1).toUpperCase()}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "var(--text)" }}>Profile</h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "14px" }}>Manage your personal finance profile.</p>
        </div>
      </div>

      {statusMessage && (
        <GlassCard style={{ padding: "12px 14px", marginBottom: "16px", color: "#F59E0B", fontSize: "13px" }}>
          {statusMessage}
        </GlassCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        <GlassCard style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: "20px", color: "var(--text)" }}>Personal Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Full Name
              <input value={form.name || ""} onChange={e => updateField("name", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Phone Number
              <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={form.phone || ""}
                onBeforeInput={e => e.data && /\D/.test(e.data) && e.preventDefault()}
                onChange={e => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Email
              <input value={form.email || ""} onChange={e => updateField("email", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Age
              <input type="number" value={form.age ?? ""} onChange={e => updateField("age", e.target.value.replace(/\D/g, "").slice(0, 3))} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              City
              <input value={form.city || ""} onChange={e => updateField("city", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Income Type
              <select value={form.incomeType || ""} onChange={e => updateField("incomeType", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }}>
                <option value="">Select income type</option>
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business">Business</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Student">Student</option>
              </select>
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Monthly Income
              <input inputMode="decimal" value={form.monthlyIncome ?? ""} onChange={e => updateField("monthlyIncome", e.target.value.replace(/[^\d.]/g, ""))} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "var(--muted)", fontSize: "13px" }}>
              Occupation
              <select value={form.occupation || ""} onChange={e => updateField("occupation", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }}>
                <option value="">Select occupation</option>
                <option value="Student">Student</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Entrepreneur">Entrepreneur</option>
                <option value="Homemaker">Homemaker</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: "18px" }}>
            <label style={{ color: "var(--muted)", fontSize: "13px", display: "block", marginBottom: "10px" }}>Risk Profile</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {["Conservative", "Balanced", "Growth"].map(item => (
                <button key={item} onClick={() => updateField("riskProfile", item)} style={{
                  padding: "11px 14px", borderRadius: "12px",
                  border: form.riskProfile === item ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: form.riskProfile === item ? "rgba(15,118,110,0.10)" : "var(--surface-alt)",
                  color: form.riskProfile === item ? "var(--primary)" : "var(--text)", cursor: "pointer",
                  fontFamily: "system-ui", fontSize: "14px"
                }}>{item}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <label style={{ color: "var(--muted)", fontSize: "13px", display: "block", marginBottom: "10px" }}>Permissions</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                ["sms", "SMS"],
                ["bank", "Bank Analysis"],
                ["notifs", "Notifications"]
              ].map(([key, label]) => (
                <button key={key} onClick={() => updateField("permissions", { ...(form.permissions || {}), [key]: !form.permissions?.[key] })} style={{
                  padding: "11px 14px", borderRadius: "12px",
                  border: form.permissions?.[key] ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: form.permissions?.[key] ? "rgba(15,118,110,0.10)" : "var(--surface-alt)",
                  color: form.permissions?.[key] ? "var(--primary)" : "var(--text)", cursor: "pointer",
                  fontFamily: "system-ui", fontSize: "14px"
                }}>{label}</button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: "13px", margin: "16px 0 0" }}>{error}</p>}
          {success && <p style={{ color: "var(--success)", fontSize: "13px", margin: "16px 0 0" }}>{success}</p>}
          <button onClick={save} style={{
            marginTop: "18px", width: "100%", padding: "16px", borderRadius: "14px", border: "none",
            background: "var(--primary)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer",
            fontFamily: "system-ui"
          }}>Save Profile</button>
        </GlassCard>

        <GlassCard style={{ padding: "24px", alignSelf: "start" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "20px", color: "var(--text)" }}>Profile Summary</h2>
          {[
            ["Name", form.name || "-"],
            ["Phone", form.phone || "-"],
            ["City", form.city || "-"],
            ["Income", formatCurrency(form.monthlyIncome)],
            ["Occupation", form.occupation || "-"],
            ["Risk", form.riskProfile || "-"]
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "14px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--muted)" }}>{label}</span>
              <strong style={{ textAlign: "right", color: "var(--text)" }}>{value}</strong>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}
