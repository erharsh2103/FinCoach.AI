import { useState } from "react";
import { GlassCard, inputStyle } from "../widgets/widgetShared";
import { accountTypes } from "../../constants";

export function AccountForm({ account, onSave, onCancel }) {
  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState(account?.type || "bank");
  const [subtype, setSubtype] = useState(account?.subtype || "savings");
  const [balance, setBalance] = useState(account?.balance ?? "");
  const [bankName, setBankName] = useState(account?.bankName || "");
  const [ifsc, setIfsc] = useState(account?.ifsc || "");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Account name is required.");
      return;
    }
    if (String(balance).trim() === "" || Number(balance) < 0 || Number.isNaN(Number(balance))) {
      setError("Balance must be a valid non-negative number.");
      return;
    }
    if (type === "bank" && !bankName.trim()) {
      setError("Bank name is required for bank accounts.");
      return;
    }
    onSave({
      id: account?.id,
      name: name.trim(),
      type,
      subtype: type === "bank" ? subtype : "",
      balance: Number(balance),
      bankName: type === "bank" ? bankName.trim() : "",
      ifsc: type === "bank" ? ifsc.trim() : ""
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", padding: "20px" }}>
      <GlassCard style={{ width: "min(520px, 100%)", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "var(--text)", margin: 0, fontSize: "20px" }}>{account ? "Edit Account" : "Add Account"}</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <label style={{ color: "var(--muted)", fontSize: "13px" }}>Account Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savings Account" style={inputStyle} />

          <label style={{ color: "var(--muted)", fontSize: "13px" }}>Account Type</label>
          <div style={{ display: "flex", gap: "12px" }}>
            {accountTypes.map(option => (
              <button key={option.id} onClick={() => setType(option.id)} style={{
                flex: 1, padding: "12px", borderRadius: "14px", border: type === option.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                background: type === option.id ? "rgba(15,118,110,0.16)" : "var(--surface-alt)", color: type === option.id ? "var(--primary)" : "var(--text)", cursor: "pointer"
              }}>{option.label}</button>
            ))}
          </div>

          {type === "bank" && (
            <>
              <label style={{ color: "var(--muted)", fontSize: "13px" }}>Bank Account Type</label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { value: "savings", label: "Savings" },
                  { value: "current", label: "Current" }
                ].map(item => (
                  <button key={item.value} onClick={() => setSubtype(item.value)} style={{
                    flex: 1, padding: "12px", borderRadius: "14px", border: subtype === item.value ? "1px solid var(--primary)" : "1px solid var(--border)",
                    background: subtype === item.value ? "rgba(15,118,110,0.16)" : "var(--surface-alt)", color: subtype === item.value ? "var(--primary)" : "var(--text)", cursor: "pointer"
                  }}>{item.label}</button>
                ))}
              </div>
              <label style={{ color: "var(--muted)", fontSize: "13px" }}>Bank Name</label>
              <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Axis Bank" style={inputStyle} />
              <label style={{ color: "var(--muted)", fontSize: "13px" }}>IFSC Code</label>
              <input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="e.g. UTIB0001234" style={inputStyle} />
            </>
          )}

          <label style={{ color: "var(--muted)", fontSize: "13px" }}>Starting Balance</label>
          <input value={balance} onChange={e => setBalance(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" style={inputStyle} />

          {error && <div style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</div>}

          <button onClick={handleSubmit} style={{
            width: "100%", padding: "16px", borderRadius: "14px", border: "none",
            background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer"
          }}>{account ? "Save Changes" : "Create Account"}</button>
        </div>
      </GlassCard>
    </div>
  );
}
