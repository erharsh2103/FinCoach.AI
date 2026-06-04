// Desktop sidebar navigation.
export function SideNav({ page, setPage, profile, onLogout }) {
  const tabs = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "finances", icon: "🏦", label: "Finances" },
    { id: "goals", icon: "🎯", label: "Goals" },
    { id: "ai", icon: "🧠", label: "AI Coach" },
    { id: "aicopilot", icon: "🤖", label: "Copilot" },
    { id: "financialai", icon: "⚡", label: "Financial AI" },
    { id: "investadvisor", icon: "📈", label: "Investment Advisor" },
    { id: "calculator", icon: "🔢", label: "Calculator" },
    { id: "upgradeplan", icon: "⬆", label: "Upgrade Plan" }
  ];
  // Finances hub owns these sub-pages — keep them highlighting the Finances tab.
  const financeChildren = ["accounts", "transactions", "analytics", "bills", "subscriptions", "cashpayments"];
  const isActive = id => page === id || (id === "finances" && financeChildren.includes(page));

  return (
    <div style={{
      width: "260px", height: "100vh", background: "var(--glass-bg)",
      backdropFilter: "blur(var(--glass-blur))", WebkitBackdropFilter: "blur(var(--glass-blur))",
      borderRight: "1px solid var(--glass-border)",
      display: "flex", flexDirection: "column", padding: "20px 0 0", boxSizing: "border-box", overflow: "hidden",
      position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50
    }}>
      <div style={{ padding: "0 20px 22px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "12px",
          background: "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff"
        }}>✦</div>
        <span style={{ color: "var(--primary)", fontWeight: "700", fontSize: "18px", fontFamily: "system-ui" }}>FinCoach.AI</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "10px" }}>
      {tabs.map(t => {
        const active = isActive(t.id);
        return (
          <button key={t.id} onClick={() => setPage(t.id)} style={{
            background: active ? "rgba(15,185,129,0.10)" : "none",
            border: "none", borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
            color: active ? "var(--primary)" : "var(--muted)",
            padding: "12px 20px", fontSize: "15px", fontFamily: "system-ui",
            width: "100%", textAlign: "left", transition: "all 0.2s"
          }}>
            <span style={{ fontSize: "18px" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
      </div>
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--glass-border)", padding: "12px 0" }}>
        <button onClick={() => setPage("profile")} style={{
          background: page === "profile" ? "rgba(15,185,129,0.10)" : "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "12px", color: "var(--text)", padding: "10px 20px",
          fontSize: "14px", fontFamily: "system-ui", width: "100%", textAlign: "left"
        }}>
          <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>
            {(profile?.name || "U").slice(0, 1).toUpperCase()}
          </span>
          <span style={{ overflow: "hidden" }}>
            <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{profile?.name || "User Profile"}</span>
            <span style={{ display: "block", color: "var(--muted)", fontSize: "12px" }}>View profile</span>
          </span>
        </button>
        <button onClick={onLogout} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "12px",
          color: "var(--muted)", padding: "10px 20px", fontSize: "15px",
          fontFamily: "system-ui", width: "100%", textAlign: "left"
        }}>
          <span>→</span><span>Logout</span>
        </button>
      </div>
    </div>
  );
}
