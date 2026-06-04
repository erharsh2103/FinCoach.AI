// Mobile bottom tab bar — dark rounded pill with icon-only tabs.
export function BottomNav({ page, setPage }) {
  const tabs = [
    { id: "dashboard", label: "Home", icon: (
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    )},
    { id: "finances", label: "Finances", icon: (
      <><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><line x1="2.5" y1="10" x2="21.5" y2="10" /></>
    )},
    { id: "ai", label: "Coach", icon: (
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4z" />
    )},
    { id: "goals", label: "Goals", icon: (
      <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>
    )},
    { id: "profile", label: "Profile", icon: (
      <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></>
    )}
  ];

  return (
    <div style={{
      position: "fixed", bottom: "18px", left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: "440px",
      background: "rgba(15,27,23,0.78)", borderRadius: "26px",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "10px 14px", zIndex: 100,
      boxShadow: "0 14px 34px rgba(15,40,30,0.34)"
    }}>
      {tabs.map(t => {
        const active = page === t.id;
        return (
          <button key={t.id} onClick={() => setPage(t.id)} aria-label={t.label} style={{
            background: active ? "#fff" : "transparent", border: "none", cursor: "pointer",
            width: "46px", height: "46px", borderRadius: "15px",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s ease"
          }}>
            <svg width="23" height="23" viewBox="0 0 24 24"
              fill="none" stroke={active ? "var(--primary)" : "rgba(255,255,255,0.55)"}
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              {t.icon}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
