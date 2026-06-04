// Sticky top bar shown on mobile layouts.
const circleBtn = {
  width: "40px", height: "40px", borderRadius: "50%",
  background: "var(--surface-alt)", border: "1px solid var(--border)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", position: "relative", color: "var(--text)"
};

export function MobileHeader({ profile }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 18px 12px", background: "rgba(236,241,239,0.72)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      position: "sticky", top: 0, zIndex: 50
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "14px",
          background: "var(--ink)", display: "flex", alignItems: "center",
          justifyContent: "center", color: "#fff", boxShadow: "var(--card-shadow)"
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.9-2.5 2s1.1 1.6 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5" />
            <line x1="12" y1="6.5" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="17.5" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px", fontWeight: "500" }}>Finance Dashboard</p>
          <span style={{ color: "var(--text)", fontWeight: "800", fontSize: "19px", fontFamily: "system-ui" }}>FinCoach.AI</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button style={circleBtn} aria-label="Notifications">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span style={{ position: "absolute", top: "9px", right: "10px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", border: "2px solid var(--surface-alt)" }} />
        </button>
        <button style={circleBtn} aria-label="Search">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </div>
  );
}
