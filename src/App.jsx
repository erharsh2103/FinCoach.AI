import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("fincoach_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-session-token": token } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
};

const loadRazorpayScript = () =>
  new Promise(resolve => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[data-razorpay="checkout"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "checkout";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  // ─── Floating Background ───────────────────────────────────────────────────
  function FloatingBg() {
    const symbols = ["₹", "₹", "₹", "₹", "₹", "₹", "📊", "💹", "💰", "🏦"];
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {symbols.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            fontSize: i % 3 === 0 ? "2rem" : "1.2rem",
            color: "rgba(255,255,255,0.06)",
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 13 + 8) % 90}%`,
            animation: `float ${4 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            fontFamily: "monospace"
          }}>{s}</div>
        ))}
        <style>{`
          @keyframes float {
            0%,100%{transform:translateY(0) rotate(0deg)}
            50%{transform:translateY(-20px) rotate(5deg)}
          }
          @keyframes spin {0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}}
          @keyframes fadeUp {from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}}
          @keyframes pulse {0%,100%{opacity:1} 50%{opacity:0.5}}
          @keyframes countUp {from{opacity:0} to{opacity:1}}
          @keyframes typing {0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)}}
          @keyframes shimmer {0%{background-position:-200% 0} 100%{background-position:200% 0}}
          @keyframes ringProgress {from{stroke-dashoffset:251} to{stroke-dashoffset:var(--target)}}
        `}</style>
      </div>
    );
  }

  // ─── Confetti (disabled) ──────────────────────────────────────────────────
  function Confetti({ show }) {
    return null;
  }

  // ─── Glass Card ───────────────────────────────────────────────────────────
  function GlassCard({ children, style = {}, onClick }) {
    return (
      <div onClick={onClick} style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        ...style
      }}>
        {children}
      </div>
    );
  }

  // ─── Donut Chart ──────────────────────────────────────────────────────────
  function DonutChart({ essentials, nonEssentials }) {
    const total = essentials + nonEssentials;
    if (!total) {
      return (
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18"/>
        </svg>
      );
    }
    const r = 45, cx = 60, cy = 60, circumference = 2 * Math.PI * r;
    const essPercent = essentials / total;
    const essDash = circumference * essPercent;
    const nonEssDash = circumference * (nonEssentials / total);
    return (
      <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2563EB" strokeWidth="18"
          strokeDasharray={`${essDash} ${circumference - essDash}`} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#059669" strokeWidth="18"
          strokeDasharray={`${nonEssDash} ${circumference - nonEssDash}`}
          strokeDashoffset={-essDash} strokeLinecap="round"/>
      </svg>
    );
  }

  // ─── Ring Progress ────────────────────────────────────────────────────────
  function RingProgress({ percent, size = 100, stroke = 10 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#grad)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB"/>
            <stop offset="100%" stopColor="#059669"/>
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // ─── Bottom Nav (Mobile) ──────────────────────────────────────────────────
  function BottomNav({ page, setPage }) {
    const tabs = [
      { id: "dashboard", icon: "⊞", label: "Dashboard" },
      { id: "accounts", icon: "🏦", label: "Accounts" },
      { id: "ai", icon: "🧠", label: "AI" },
      { id: "goals", icon: "🎯", label: "Goals" },
      { id: "more", icon: "☰", label: "More" },
      { id: "profile", icon: "●", label: "Profile" }
    ];
    return (
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(10,14,35,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", padding: "8px 0 12px", zIndex: 100
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            color: page === t.id ? "#2563EB" : "rgba(255,255,255,0.4)",
            fontSize: t.id === "dashboard" ? "22px" : "18px",
            padding: "4px 0"
          }}>
            <span>{t.icon}</span>
            <span style={{ fontSize: "10px", fontFamily: "system-ui" }}>{t.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // ─── Sidebar Nav (Desktop) ────────────────────────────────────────────────
  function SideNav({ page, setPage, profile, onLogout }) {
    const tabs = [
      { id: "dashboard", icon: "⊞", label: "Dashboard" },
      { id: "accounts", icon: "🏦", label: "Accounts" },
      { id: "transactions", icon: "🧾", label: "Transactions" },
      { id: "analytics", icon: "📊", label: "Analytics" },
      { id: "ai", icon: "🧠", label: "AI Coach" },
      { id: "goals", icon: "🎯", label: "Goals" },
      { id: "bills", icon: "🧾", label: "Bills" },
      { id: "networth", icon: "💼", label: "Net Worth" },
      { id: "budgetplanner", icon: "📋", label: "Budget Planner" },
      { id: "emicalculator", icon: "🏠", label: "EMI Calculator" },
      { id: "investadvisor", icon: "📈", label: "Investment Advisor" },
      { id: "subscriptions", icon: "🔁", label: "Subscriptions" },
      { id: "cashpayments", icon: "💵", label: "Cash Payments" },
      { id: "smartinsights", icon: "💡", label: "Smart Insights" },
      { id: "aicopilot", icon: "🤖", label: "AI Copilot" },
      { id: "financialai", icon: "⚡", label: "Financial AI" },
      { id: "premiumfeatures", icon: "✨", label: "Premium Features" },
      { id: "upgradeplan", icon: "⬆", label: "Upgrade Plan" },
      { id: "calculator", icon: "🔢", label: "Calculator" },
      { id: "community", icon: "👥", label: "Community" },
      { id: "videos", icon: "▶", label: "Videos" },
      { id: "testimonials", icon: "⭐", label: "Testimonials" },
      { id: "profile", icon: "●", label: "Profile" }
    ];
    return (
      <div style={{
        width: "260px", height: "100vh", background: "rgba(8,12,30,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", padding: "20px 0 0", boxSizing: "border-box", overflow: "hidden",
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50
      }}>
        <div style={{ padding: "0 20px 22px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "linear-gradient(135deg, #2563EB, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
          }}>✦</div>
          <span style={{ color: "#2563EB", fontWeight: "700", fontSize: "18px", fontFamily: "system-ui" }}>FinCoach.AI</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: "10px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{
            background: page === t.id ? "rgba(37,99,235,0.15)" : "none",
            border: "none", borderLeft: page === t.id ? "3px solid #2563EB" : "3px solid transparent",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
            color: page === t.id ? "#fff" : "rgba(255,255,255,0.5)",
            padding: "12px 20px", fontSize: "15px", fontFamily: "system-ui",
            width: "100%", textAlign: "left", transition: "all 0.2s"
          }}>
            <span style={{ fontSize: "18px" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        </div>
        <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 0", background: "rgba(8,12,30,0.98)" }}>
          <button onClick={() => setPage("profile")} style={{
            background: page === "profile" ? "rgba(37,99,235,0.15)" : "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "12px", color: "#fff", padding: "10px 20px",
            fontSize: "14px", fontFamily: "system-ui", width: "100%", textAlign: "left"
          }}>
            <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
              {(profile?.name || "U").slice(0, 1).toUpperCase()}
            </span>
            <span style={{ overflow: "hidden" }}>
              <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.name || "User Profile"}</span>
              <span style={{ display: "block", color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>View profile</span>
            </span>
          </button>
          <button onClick={onLogout} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "12px",
            color: "rgba(255,255,255,0.55)", padding: "10px 20px", fontSize: "15px",
            fontFamily: "system-ui", width: "100%", textAlign: "left"
          }}>
            <span>→</span><span>Logout</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── LOGIN PAGE ───────────────────────────────────────────────────────────
  function LoginPage({ onLogin }) {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("phone");
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [devOtp, setDevOtp] = useState("");
    const isPhoneValid = /^\d{10}$/.test(phone);

    const handleSend = async () => {
      if (!isPhoneValid) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
      setLoading(true);
      try {
        const result = await apiRequest("/api/auth/send-otp", {
          method: "POST",
          body: JSON.stringify({ phone })
        });
        setError("");
        setStep("otp");
        setDevOtp(result.devOtp || "");
        setToast(result.devOtp ? `OTP sent. Dev OTP: ${result.devOtp}` : "OTP sent to your phone.");
        setTimeout(() => setToast(""), 5000);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleVerify = async () => {
      if (otp.length !== 6) {
        setError("Enter the 6-digit OTP.");
        return;
      }
      setLoading(true);
      try {
        const result = await apiRequest("/api/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ phone, otp })
        });
        localStorage.setItem("fincoach_token", result.token);
        setError("");
        setToast("Login successful! Redirecting...");
        setTimeout(() => {
          setToast("");
          onLogin(result);
        }, 500);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #060B1E 0%, #0D1B3E 50%, #071520 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui", position: "relative"
      }}>
        <FloatingBg />

        {toast && (
          <div style={{
            position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #2563EB, #059669)",
            color: "#fff", padding: "12px 24px", borderRadius: "12px",
            fontSize: "14px", zIndex: 1000, fontWeight: "600"
          }}>{toast}</div>
        )}

        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <button style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", padding: "8px 16px", borderRadius: "20px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px", fontSize: "14px"
          }}>🌐 English</button>
        </div>

        <div style={{ textAlign: "center", marginBottom: "40px", zIndex: 1, animation: "fadeUp 0.6s ease" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "24px",
            background: "linear-gradient(135deg, #2563EB, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", margin: "0 auto 20px", boxShadow: "0 0 40px rgba(37,99,235,0.4)"
          }}>✦</div>
          <h1 style={{ color: "#2563EB", fontSize: "36px", fontWeight: "800", margin: "0 0 8px" }}>FinCoach.AI</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", margin: 0 }}>Not just tracking, real coaching.</p>
        </div>

        <GlassCard style={{ width: "min(420px, 90vw)", padding: "36px", zIndex: 1, animation: "fadeUp 0.6s ease 0.2s both" }}>
          <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: "700", margin: "0 0 8px", textAlign: "center" }}>
            Your Financial Journey Starts Here
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", fontSize: "14px", margin: "0 0 28px" }}>
            Smart coaching powered by AI — in your language.
          </p>

          {step === "phone" ? (
            <>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "8px" }}>Phone Number</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <div style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px",
                  display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
                }}>🇮🇳 +91 ▾</div>
                <input
                  type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10}
                  placeholder="Enter 10-digit number" value={phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(digits);
                    setError(digits && digits.length !== 10 ? "Phone number must be exactly 10 digits." : "");
                  }}
                  onBlur={() => phone && !isPhoneValid && setError("Phone number must be exactly 10 digits.")}
                  onBeforeInput={e => e.data && /\D/.test(e.data) && e.preventDefault()}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
              {error && <p style={{ color: "#F87171", fontSize: "13px", margin: "0 0 16px" }}>{error}</p>}
              <button onClick={handleSend} disabled={!isPhoneValid || loading} style={{
                width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                background: isPhoneValid ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "16px", fontWeight: "700", cursor: isPhoneValid ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}>{loading ? "Sending OTP..." : "📞 Start Your Financial Journey"}</button>
            </>
          ) : (
            <>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "8px" }}>Enter OTP</label>
              {devOtp && <p style={{ color: "#34D399", fontSize: "13px", margin: "0 0 10px" }}>Development OTP: {devOtp}</p>}
              <input
                type="tel" inputMode="numeric" placeholder="Enter 6-digit OTP" value={otp} maxLength={6}
                onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px", padding: "12px 16px", color: "#fff", fontSize: "18px",
                  letterSpacing: "8px", textAlign: "center", outline: "none", boxSizing: "border-box",
                  marginBottom: "16px"
                }}
              />
              <button onClick={handleVerify} disabled={otp.length !== 6 || loading} style={{
                width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                background: otp.length === 6 ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.1)",
                color: "#fff", fontSize: "16px", fontWeight: "700", cursor: otp.length === 6 ? "pointer" : "default"
              }}>{loading ? "Verifying..." : "✓ Verify OTP"}</button>
              <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} style={{
                width: "100%", padding: "12px", borderRadius: "14px", border: "none", marginTop: "10px",
                background: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "14px"
              }}>Change phone number</button>
            </>
          )}
        </GlassCard>

        <div style={{
          display: "flex", gap: "24px", marginTop: "24px", zIndex: 1,
          color: "rgba(255,255,255,0.4)", fontSize: "13px"
        }}>
          <span>🔒 256-bit encryption</span>
          <span>·</span>
          <span>🚫 No spam calls</span>
          <span>·</span>
          <span>🇮🇳 Made in India</span>
        </div>
      </div>
    );
  }

  // ─── ONBOARDING ───────────────────────────────────────────────────────────
  function OnboardingPage({ onDone }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ name: "", age: "", incomeType: "", income: "" });
    const [perms, setPerms] = useState({ sms: false, bank: false, notifs: false });

    const steps = [
      { icon: "👋", title: "What's your name?", sub: "Let's personalize your experience" },
      { icon: "💰", title: "Your Income Details", sub: "Help us understand your financial situation" },
      { icon: "💼", title: "What's your occupation?", sub: "We'll tailor advice for you" },
      { icon: "🔐", title: "Your Privacy First", sub: "" }
    ];

    const progress = (step / 4) * 100;

    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #060B1E 0%, #0D1B3E 50%, #071520 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        fontFamily: "system-ui", paddingTop: "40px", paddingBottom: "40px"
      }}>
        <FloatingBg />
        <div style={{ width: "min(600px, 90vw)", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            <span>Step {step} of 4</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", marginBottom: "30px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #2563EB, #059669)", borderRadius: "4px", transition: "width 0.5s ease" }}/>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "40px" }}>
            {["👤","₹","💼","📋"].map((icon, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: i + 1 <= step ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                  border: i + 1 === step ? "2px solid #2563EB" : "none",
                  transition: "all 0.3s"
                }}>{icon}</div>
                {i < 3 && <div style={{ width: "40px", height: "2px", background: i + 1 < step ? "#2563EB" : "rgba(255,255,255,0.1)", marginTop: "-24px", marginLeft: "48px", position: "absolute" }}/>}
              </div>
            ))}
          </div>

          {step < 4 ? (
            <GlassCard style={{ padding: "36px", animation: "fadeUp 0.4s ease" }}>
              <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 8px" }}>
                {steps[step-1].icon} {steps[step-1].title}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 28px", fontSize: "14px" }}>{steps[step-1].sub}</p>

              {step === 1 && (
                <>
                  <input placeholder="Full Name" value={data.name} onChange={e => setData({...data, name: e.target.value})}
                    style={inputStyle} />
                  <input placeholder="Age" type="number" value={data.age} onChange={e => setData({...data, age: e.target.value})}
                    style={{...inputStyle, marginTop: "12px"}} />
                </>
              )}
              {step === 2 && (
                <>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    {["Salaried","Self-Employed","Business"].map(t => (
                      <button key={t} onClick={() => setData({...data, incomeType: t})} style={{
                        flex: 1, padding: "12px", borderRadius: "12px", border: "none", cursor: "pointer",
                        background: data.incomeType === t ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
                        color: "#fff", fontSize: "13px", fontWeight: "600"
                      }}>{t}</button>
                    ))}
                  </div>
                  <input placeholder="Monthly Income (₹)" type="number" value={data.income}
                    onChange={e => setData({...data, income: e.target.value})} style={inputStyle} />
                </>
              )}
              {step === 3 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {["Student","Government","Private","Freelancer","Entrepreneur","Homemaker"].map(o => (
                    <button key={o} onClick={() => setData({...data, occ: o})} style={{
                      padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer",
                      background: data.occ === o ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
                      color: "#fff", fontSize: "14px"
                    }}>{o}</button>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(s => s + 1)} style={{
                width: "100%", padding: "16px", marginTop: "24px", borderRadius: "14px", border: "none",
                background: "linear-gradient(135deg, #2563EB, #059669)",
                color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}>Continue ›</button>
            </GlassCard>
          ) : (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "24px", margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #F59E0B, #059669)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px"
                }}>🔒</div>
                <h2 style={{ color: "#fff", fontSize: "26px", fontWeight: "700", margin: "0 0 8px" }}>Your Privacy First</h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                  We only read financial messages — <span style={{ color: "#059669" }}>encrypted, private, safe ✅</span>
                </p>
              </div>
              {[
                { icon: "📱", title: "Read Financial SMS", desc: "We only scan bank/payment messages to auto-detect transactions. Fully encrypted." },
                { icon: "🏦", title: "Bank Statement Analysis", desc: "Analyze your spending patterns to give smarter AI coaching recommendations." },
                { icon: "🔔", title: "Smart Notifications", desc: "Get timely reminders for bills, goals, and investment opportunities." }
              ].map((p, i) => (
                <GlassCard key={i} style={{ padding: "20px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "28px" }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: "600", marginBottom: "4px" }}>{p.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{p.desc}</div>
                  </div>
                  <div onClick={() => setPerms(pr => ({...pr, [["sms","bank","notifs"][i]]: !pr[["sms","bank","notifs"][i]]}))}
                    style={{
                      width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer",
                      border: "2px solid rgba(255,255,255,0.3)",
                      background: Object.values(perms)[i] ? "linear-gradient(135deg,#2563EB,#059669)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px"
                    }}>{Object.values(perms)[i] ? "✓" : ""}</div>
                </GlassCard>
              ))}
              <GlassCard style={{ padding: "14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🔒</span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                  Data is <strong style={{ color: "#fff" }}>never sold</strong> to third parties. Read our{" "}
                  <span style={{ color: "#2563EB" }}>Privacy Policy</span>.
                </span>
              </GlassCard>
              <button onClick={onDone} style={{
                width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                background: "linear-gradient(135deg, #2563EB, #059669)",
                color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginBottom: "12px"
              }}>Continue to Dashboard ›</button>
              <button onClick={onDone} style={{
                width: "100%", padding: "12px", borderRadius: "14px", border: "none",
                background: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "14px"
              }}>Skip for now →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function SurveyOnboardingPage({ initialProfile, onDone }) {
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
        background: "linear-gradient(135deg, #060B1E 0%, #0D1B3E 50%, #071520 100%)",
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            <span>Step {step} of {surveySteps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", marginBottom: "30px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #2563EB, #059669)", borderRadius: "4px", transition: "width 0.5s ease" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "40px", flexWrap: "wrap" }}>
            {["👤", "₹", "💼", "📋"].map((icon, index) => (
              <div key={icon} style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: index + 1 <= step ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                border: index + 1 === step ? "2px solid #2563EB" : "none"
              }}>{icon}</div>
            ))}
          </div>

          <GlassCard style={{ padding: "36px", animation: "fadeUp 0.4s ease" }}>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 8px" }}>
              {surveySteps[step - 1].icon} {surveySteps[step - 1].title}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", margin: "0 0 28px", fontSize: "14px" }}>{surveySteps[step - 1].sub}</p>

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
                      background: data.incomeType === item ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
                      color: "#fff",
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
                      background: data.occupation === item ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
                      color: "#fff",
                      fontSize: "14px"
                    }}>{item}</button>
                  ))}
                </div>
                <div style={{ marginTop: "18px" }}>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "10px" }}>Risk Profile</div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {["Conservative", "Balanced", "Growth"].map(item => (
                      <button key={item} onClick={() => setData(current => ({ ...current, riskProfile: item }))} style={{
                        padding: "11px 14px",
                        borderRadius: "12px",
                        border: data.riskProfile === item ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.14)",
                        background: data.riskProfile === item ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)",
                        color: "#fff",
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
                      <div style={{ color: "#fff", fontWeight: "600", marginBottom: "4px" }}>{item.title}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{item.desc}</div>
                    </div>
                    <button onClick={() => setPermissions(current => ({ ...current, [item.key]: !current[item.key] }))} style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      background: permissions[item.key] ? "linear-gradient(135deg,#2563EB,#059669)" : "transparent",
                      color: "#fff",
                      cursor: "pointer"
                    }}>{permissions[item.key] ? "✓" : ""}</button>
                  </GlassCard>
                ))}
              </>
            )}

            {error && <p style={{ color: "#F87171", fontSize: "13px", margin: "16px 0 0" }}>{error}</p>}
            <button onClick={handleContinue} disabled={loading} style={{
              width: "100%",
              padding: "16px",
              marginTop: "24px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #2563EB, #059669)",
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

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "12px", padding: "14px 16px", color: "#fff", fontSize: "15px",
    outline: "none", boxSizing: "border-box", fontFamily: "system-ui"
  };

  const accountTypes = [
    { id: "bank", label: "Bank Account" },
    { id: "cash", label: "Cash Wallet" }
  ];

  const defaultProfile = {
    name: "",
    phone: "",
    age: "",
    email: "",
    city: "",
    incomeType: "",
    monthlyIncome: 0,
    riskProfile: "",
    occupation: "",
    permissions: {
      sms: false,
      bank: false,
      notifs: false
    }
  };

  // ─── ACCOUNTS PAGE ────────────────────────────────────────────────────────
  function AccountsPage({
    accounts,
    transactions,
    totalBalance,
    filteredTransactions,
    onEditAccount,
    onDeleteAccount,
    onSaveAccount,
    accountModal,
    setAccountModal,
    transferState,
    setTransferState,
    onTransfer,
    pdfFilter,
    setPdfFilter,
    exportRef,
    onExportPDF,
    statusMessage
  }) {
    const accountName = id => accounts.find(account => account.id === id)?.name || "Deleted account";
    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>Your Accounts</h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
              Combined balance: <strong style={{ color: "#fff" }}>{formatCurrency(totalBalance)}</strong>
            </p>
          </div>
          <button onClick={() => setAccountModal({ open: true, account: null })} style={{
            background: "linear-gradient(135deg, #2563EB, #059669)", border: "none",
            color: "#fff", padding: "12px 20px", borderRadius: "12px", cursor: "pointer",
            fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px"
          }}>➕ Add Account</button>
        </div>

        {statusMessage && (
          <GlassCard style={{ padding: "12px 14px", marginBottom: "16px", color: "#FBBF24", fontSize: "13px" }}>
            {statusMessage}
          </GlassCard>
        )}

        <GlassCard style={{ padding: "20px", marginBottom: "20px", background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(5,150,105,0.16))" }}>
          <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>Total Balance</p>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#fff" }}>{formatCurrency(totalBalance)}</div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px", color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
            <span>Bank: {formatCurrency(accounts.filter(account => account.type === "bank").reduce((sum, account) => sum + Number(account.balance || 0), 0))}</span>
            <span>Cash: {formatCurrency(accounts.filter(account => account.type === "cash").reduce((sum, account) => sum + Number(account.balance || 0), 0))}</span>
          </div>
        </GlassCard>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {accounts.map(account => (
            <GlassCard key={account.id} style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "700" }}>{account.name}</h3>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                    {account.type === "bank" ? `${account.subtype} • ${account.bankName}` : "Cash Wallet"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => onEditAccount(account)} style={{
                    background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px",
                    padding: "6px", cursor: "pointer", color: "#fff"
                  }}>✏️</button>
                  <button onClick={() => onDeleteAccount(account.id)} style={{
                    background: "rgba(239,68,68,0.2)", border: "none", borderRadius: "8px",
                    padding: "6px", cursor: "pointer", color: "#EF4444"
                  }}>🗑️</button>
                </div>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669" }}>
                {formatCurrency(account.balance)}
              </div>
              {account.type === "bank" && (
                <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                  IFSC: {account.ifsc}
                </p>
              )}
            </GlassCard>
          ))}
        </div>

        <GlassCard style={{ padding: "20px", marginTop: "20px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "20px" }}>Transfer Money</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "end" }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              From
              <select value={transferState.fromId} onChange={e => setTransferState(prev => ({ ...prev, fromId: e.target.value, error: "", success: "" }))} style={{ ...inputStyle, marginTop: "8px" }}>
                <option value="">Select account</option>
                {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              To
              <select value={transferState.toId} onChange={e => setTransferState(prev => ({ ...prev, toId: e.target.value, error: "", success: "" }))} style={{ ...inputStyle, marginTop: "8px" }}>
                <option value="">Select account</option>
                {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              Amount
              <input inputMode="decimal" value={transferState.amount} onChange={e => setTransferState(prev => ({ ...prev, amount: e.target.value.replace(/[^\d.]/g, ""), error: "", success: "" }))} placeholder="0" style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <button onClick={onTransfer} disabled={accounts.length < 2} style={{
              padding: "15px 18px", borderRadius: "14px", border: "none",
              background: accounts.length < 2 ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #2563EB, #059669)",
              color: "#fff", cursor: accounts.length < 2 ? "default" : "pointer", fontWeight: "700"
            }}>Transfer</button>
          </div>
          {transferState.error && <p style={{ margin: "12px 0 0", color: "#F87171", fontSize: "13px" }}>{transferState.error}</p>}
          {transferState.success && <p style={{ margin: "12px 0 0", color: "#34D399", fontSize: "13px" }}>{transferState.success}</p>}
        </GlassCard>

        <GlassCard style={{ padding: "20px", marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "20px" }}>PDF Financial Report</h2>
            <button onClick={onExportPDF} style={{
              background: "linear-gradient(135deg, #2563EB, #059669)", border: "none",
              color: "#fff", padding: "12px 18px", borderRadius: "12px", cursor: "pointer", fontWeight: "700"
            }}>Download PDF</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              Start Date
              <input type="date" value={pdfFilter.startDate} onChange={e => setPdfFilter(prev => ({ ...prev, startDate: e.target.value }))} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              End Date
              <input type="date" value={pdfFilter.endDate} onChange={e => setPdfFilter(prev => ({ ...prev, endDate: e.target.value }))} style={{ ...inputStyle, marginTop: "8px" }} />
            </label>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              Account
              <select value={pdfFilter.accountId} onChange={e => setPdfFilter(prev => ({ ...prev, accountId: e.target.value }))} style={{ ...inputStyle, marginTop: "8px" }}>
                <option value="all">All accounts</option>
                {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
          </div>

          <div ref={exportRef} style={{ background: "#071520", padding: "20px", borderRadius: "12px", color: "#fff" }}>
            <h2 style={{ margin: "0 0 6px" }}>FinCoach Financial Report</h2>
            <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              Date range: {pdfFilter.startDate || "Start"} to {pdfFilter.endDate || "Today"} | Account: {pdfFilter.accountId === "all" ? "All accounts" : accountName(pdfFilter.accountId)}
            </p>
            <h3 style={{ margin: "0 0 10px" }}>Account Balances</h3>
            <div style={{ overflowX: "auto", marginBottom: "18px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
                <thead>
                  <tr>{["Account", "Type", "Bank Details", "Balance"].map(header => <th key={header} style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.14)", color: "#93C5FD" }}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id}>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{account.name}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{account.type === "bank" ? account.subtype : "cash"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{account.type === "bank" ? `${account.bankName} ${account.ifsc || ""}` : "-"}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{formatCurrency(account.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ margin: "0 0 10px" }}>Transaction History</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "620px" }}>
                <thead>
                  <tr>{["Date", "Type", "Account", "Description", "Amount"].map(header => <th key={header} style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.14)", color: "#93C5FD" }}>{header}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredTransactions.length ? filteredTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{transaction.date}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{transaction.type}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {transaction.type === "transfer" ? `${accountName(transaction.fromId)} -> ${accountName(transaction.toId)}` : accountName(transaction.accountId)}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{transaction.description}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{formatCurrency(transaction.amount)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ padding: "14px", color: "rgba(255,255,255,0.55)" }}>No transactions found for this filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>

        {accountModal.open && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000
          }}>
            <AccountForm
              account={accountModal.account}
              onSave={onSaveAccount}
              onCancel={() => setAccountModal({ open: false, account: null })}
            />
          </div>
        )}
      </div>
    );
  }

  const formatCurrency = value => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

  function AccountForm({ account, onSave, onCancel }) {
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
            <h2 style={{ color: "#fff", margin: 0, fontSize: "20px" }}>{account ? "Edit Account" : "Add Account"}</h2>
            <button onClick={onCancel} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "18px" }}>✕</button>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Account Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Savings Account" style={inputStyle} />

            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Account Type</label>
            <div style={{ display: "flex", gap: "12px" }}>
              {accountTypes.map(option => (
                <button key={option.id} onClick={() => setType(option.id)} style={{
                  flex: 1, padding: "12px", borderRadius: "14px", border: type === option.id ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.15)",
                  background: type === option.id ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer"
                }}>{option.label}</button>
              ))}
            </div>

            {type === "bank" && (
              <>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Bank Account Type</label>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    { value: "savings", label: "Savings" },
                    { value: "current", label: "Current" }
                  ].map(item => (
                    <button key={item.value} onClick={() => setSubtype(item.value)} style={{
                      flex: 1, padding: "12px", borderRadius: "14px", border: subtype === item.value ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.15)",
                      background: subtype === item.value ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer"
                    }}>{item.label}</button>
                  ))}
                </div>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Bank Name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Axis Bank" style={inputStyle} />
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>IFSC Code</label>
                <input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="e.g. UTIB0001234" style={inputStyle} />
              </>
            )}

            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Starting Balance</label>
            <input value={balance} onChange={e => setBalance(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" style={inputStyle} />

            {error && <div style={{ color: "#F87171", fontSize: "13px" }}>{error}</div>}

            <button onClick={handleSubmit} style={{
              width: "100%", padding: "16px", borderRadius: "14px", border: "none",
              background: "linear-gradient(135deg, #2563EB, #059669)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer"
            }}>{account ? "Save Changes" : "Create Account"}</button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  function ProfilePage({ profile, onSaveProfile, statusMessage }) {
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
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #2563EB, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "30px", fontWeight: "800", flexShrink: 0
          }}>{(form.name || "U").slice(0, 1).toUpperCase()}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>Profile</h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>Manage your personal finance profile.</p>
          </div>
        </div>

        {statusMessage && (
          <GlassCard style={{ padding: "12px 14px", marginBottom: "16px", color: "#FBBF24", fontSize: "13px" }}>
            {statusMessage}
          </GlassCard>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <GlassCard style={{ padding: "24px" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: "20px" }}>Personal Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
                Full Name
                <input value={form.name || ""} onChange={e => updateField("name", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
              </label>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
                Phone Number
                <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={form.phone || ""}
                  onBeforeInput={e => e.data && /\D/.test(e.data) && e.preventDefault()}
                  onChange={e => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{ ...inputStyle, marginTop: "8px" }} />
              </label>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
                Email
                <input value={form.email || ""} onChange={e => updateField("email", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
              </label>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
                Age
                <input type="number" value={form.age ?? ""} onChange={e => updateField("age", e.target.value.replace(/\D/g, "").slice(0, 3))} style={{ ...inputStyle, marginTop: "8px" }} />
              </label>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
                City
                <input value={form.city || ""} onChange={e => updateField("city", e.target.value)} style={{ ...inputStyle, marginTop: "8px" }} />
              </label>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
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
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
                Monthly Income
                <input inputMode="decimal" value={form.monthlyIncome ?? ""} onChange={e => updateField("monthlyIncome", e.target.value.replace(/[^\d.]/g, ""))} style={{ ...inputStyle, marginTop: "8px" }} />
              </label>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
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
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", display: "block", marginBottom: "10px" }}>Risk Profile</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {["Conservative", "Balanced", "Growth"].map(item => (
                  <button key={item} onClick={() => updateField("riskProfile", item)} style={{
                    padding: "11px 14px", borderRadius: "12px", border: form.riskProfile === item ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.14)",
                    background: form.riskProfile === item ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)",
                    color: "#fff", cursor: "pointer"
                  }}>{item}</button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", display: "block", marginBottom: "10px" }}>Permissions</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  ["sms", "SMS"],
                  ["bank", "Bank Analysis"],
                  ["notifs", "Notifications"]
                ].map(([key, label]) => (
                  <button key={key} onClick={() => updateField("permissions", { ...(form.permissions || {}), [key]: !form.permissions?.[key] })} style={{
                    padding: "11px 14px", borderRadius: "12px", border: form.permissions?.[key] ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.14)",
                    background: form.permissions?.[key] ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.06)",
                    color: "#fff", cursor: "pointer"
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#F87171", fontSize: "13px", margin: "16px 0 0" }}>{error}</p>}
            {success && <p style={{ color: "#34D399", fontSize: "13px", margin: "16px 0 0" }}>{success}</p>}
            <button onClick={save} style={{
              marginTop: "18px", width: "100%", padding: "16px", borderRadius: "14px", border: "none",
              background: "linear-gradient(135deg, #2563EB, #059669)", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer"
            }}>Save Profile</button>
          </GlassCard>

          <GlassCard style={{ padding: "24px", alignSelf: "start" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "20px" }}>Profile Summary</h2>
            {[
              ["Name", form.name || "-"],
              ["Phone", form.phone || "-"],
              ["City", form.city || "-"],
              ["Income", formatCurrency(form.monthlyIncome)],
              ["Occupation", form.occupation || "-"],
              ["Risk", form.riskProfile || "-"]
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "14px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <strong style={{ textAlign: "right" }}>{value}</strong>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    );
  }

  function TransactionsPage({ transactions, accounts, onAddTransaction, onDeleteTransaction }) {
    const [filter, setFilter] = useState("all");
    const [form, setForm] = useState({
      description: "",
      category: "Food & Dining",
      amount: "",
      type: "expense",
      accountId: accounts[0]?.id || "",
      date: new Date().toISOString().slice(0, 10)
    });
    const [error, setError] = useState("");
    const categories = ["Food & Dining", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Income", "Others"];
    const visible = transactions.filter(tx => filter === "all" || tx.type === filter);
    const income = transactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const expenses = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const submit = async () => {
      try {
        await onAddTransaction(form);
        setForm(prev => ({ ...prev, description: "", amount: "" }));
        setError("");
      } catch (error) {
        setError(error.message);
      }
    };

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Transactions</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "18px" }}>
          {[["Income", income, "#34D399"], ["Expenses", expenses, "#F87171"], ["Net", income - expenses, "#60A5FA"]].map(([label, value, color]) => (
            <GlassCard key={label} style={{ padding: "18px" }}>
              <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>{label}</p>
              <strong style={{ fontSize: "24px", color }}>{formatCurrency(value)}</strong>
            </GlassCard>
          ))}
        </div>

        <GlassCard style={{ padding: "20px", marginBottom: "18px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "19px" }}>Add Transaction</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === "income" ? "Income" : form.category })} style={inputStyle}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" style={inputStyle} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
            <input inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Amount" style={inputStyle} />
            <select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} style={inputStyle}>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </div>
          {error && <p style={{ color: "#F87171", fontSize: "13px" }}>{error}</p>}
          <button onClick={submit} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2563EB,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Save Transaction</button>
        </GlassCard>

        <GlassCard style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "19px" }}>History</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "income", "expense"].map(item => (
                <button key={item} onClick={() => setFilter(item)} style={{ padding: "8px 12px", borderRadius: "12px", border: "none", color: "#fff", background: filter === item ? "#2563EB" : "rgba(255,255,255,0.08)", cursor: "pointer" }}>{item}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: "660px", borderCollapse: "collapse" }}>
              <thead><tr>{["Date", "Type", "Category", "Description", "Amount", ""].map(h => <th key={h} style={{ textAlign: "left", padding: "10px", color: "#93C5FD", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {visible.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{tx.date}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{tx.type}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{tx.category || "-"}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{tx.description}</td>
                    <td style={{ padding: "10px", color: tx.type === "income" ? "#34D399" : "#F87171", fontWeight: 800, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}><button onClick={() => onDeleteTransaction(tx.id)} style={{ background: "rgba(239,68,68,0.16)", color: "#F87171", border: "none", borderRadius: "8px", padding: "7px 10px", cursor: "pointer" }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    );
  }

  function AnalyticsPage({ transactions, accounts }) {
    const income = transactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const expenses = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const byCategory = transactions.filter(tx => tx.type === "expense").reduce((acc, tx) => ({ ...acc, [tx.category || "Others"]: (acc[tx.category || "Others"] || 0) + Number(tx.amount || 0) }), {});
    const savingsRate = income ? Math.round(((income - expenses) / income) * 100) : 0;

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Analytics</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "18px" }}>
          {[["Savings Rate", `${savingsRate}%`, "#60A5FA"], ["Accounts", accounts.length, "#34D399"], ["Expense Categories", Object.keys(byCategory).length, "#FBBF24"]].map(([label, value, color]) => (
            <GlassCard key={label} style={{ padding: "18px" }}><p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.55)" }}>{label}</p><strong style={{ fontSize: "25px", color }}>{value}</strong></GlassCard>
          ))}
        </div>
        <GlassCard style={{ padding: "20px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "19px" }}>Category Breakdown</h2>
          {Object.entries(byCategory).length ? Object.entries(byCategory).map(([category, amount]) => {
            const pct = expenses ? Math.round((amount / expenses) * 100) : 0;
            return (
              <div key={category} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span>{category}</span><strong>{formatCurrency(amount)}</strong></div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "999px" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} /></div>
              </div>
            );
          }) : <p style={{ color: "rgba(255,255,255,0.55)" }}>Add expenses to see analytics.</p>}
        </GlassCard>
      </div>
    );
  }

  function BillsPage({ bills, onAddBill, onPayBill, onDeleteBill }) {
    const [form, setForm] = useState({ name: "", due: "", amount: "", status: "upcoming" });
    const submit = async () => {
      await onAddBill(form);
      setForm({ name: "", due: "", amount: "", status: "upcoming" });
    };
    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: "28px", fontWeight: "800" }}>Bills & Reminders</h1>
        <GlassCard style={{ padding: "20px", marginBottom: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bill name" style={inputStyle} />
            <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} style={inputStyle} />
            <input inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Amount" style={inputStyle} />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}><option>upcoming</option><option>overdue</option><option>paid</option></select>
          </div>
          <button onClick={submit} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2563EB,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Add Bill</button>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
          {bills.map(bill => (
            <GlassCard key={bill.id} style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}><strong>{bill.name}</strong><span style={{ color: bill.status === "paid" ? "#34D399" : bill.status === "overdue" ? "#F87171" : "#FBBF24" }}>{bill.status}</span></div>
              <p style={{ color: "rgba(255,255,255,0.55)", margin: "8px 0" }}>Due: {bill.due}</p>
              <strong style={{ fontSize: "22px" }}>{formatCurrency(bill.amount)}</strong>
              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button onClick={() => onPayBill(bill.id)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "rgba(5,150,105,0.2)", color: "#34D399", cursor: "pointer" }}>Paid</button>
                <button onClick={() => onDeleteBill(bill.id)} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.16)", color: "#F87171", cursor: "pointer" }}>Delete</button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  function GoalsManagerPage({ goals, onAddGoal, onFundGoal, onDeleteGoal }) {
    const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", icon: "Goal" });
    const [fund, setFund] = useState({});
    const submit = async () => {
      await onAddGoal(form);
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
          <button onClick={submit} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2563EB,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Add Goal</button>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((Number(goal.current || 0) / Number(goal.target || 1)) * 100));
            return (
              <GlassCard key={goal.id} style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><strong>{goal.name}</strong><span>{pct}%</span></div>
                <div style={{ height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", marginBottom: "10px" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} /></div>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 12px" }}>{formatCurrency(goal.current)} of {formatCurrency(goal.target)} {goal.deadline ? `by ${goal.deadline}` : ""}</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input value={fund[goal.id] || ""} onChange={e => setFund({ ...fund, [goal.id]: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Add funds" style={{ ...inputStyle, padding: "10px" }} />
                  <button onClick={() => onFundGoal(goal.id, fund[goal.id])} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "#2563EB", color: "#fff", cursor: "pointer" }}>Fund</button>
                  <button onClick={() => onDeleteGoal(goal.id)} style={{ padding: "10px 12px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.16)", color: "#F87171", cursor: "pointer" }}>Delete</button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    );
  }

  function FeatureHubPage({ title, subtitle, children }) {
    return <div style={{ color: "#fff", fontFamily: "system-ui" }}><h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: "800" }}>{title}</h1><p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.55)" }}>{subtitle}</p>{children}</div>;
  }

  function NetWorthPage({ accounts }) {
    const assets = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0) + 185000;
    const liabilities = 42000;
    return <FeatureHubPage title="Net Worth" subtitle="Track assets, liabilities, and your overall financial position."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>{[["Assets", assets, "#34D399"], ["Liabilities", liabilities, "#F87171"], ["Net Worth", assets - liabilities, "#60A5FA"]].map(([l, v, c]) => <GlassCard key={l} style={{ padding: "20px" }}><p style={{ color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>{l}</p><strong style={{ color: c, fontSize: "28px" }}>{formatCurrency(v)}</strong></GlassCard>)}</div></FeatureHubPage>;
  }

  function BudgetPlannerPage({ profile }) {
    const income = Number(profile?.monthlyIncome || 0) || 50000;
    const rows = [["Needs", 0.5], ["Wants", 0.3], ["Savings & Investments", 0.2]];
    return <FeatureHubPage title="Budget Planner" subtitle="Use the 50/30/20 rule to plan spending from your monthly income."><GlassCard style={{ padding: "22px" }}>{rows.map(([label, pct]) => <div key={label} style={{ marginBottom: "16px" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span>{label}</span><strong>{formatCurrency(income * pct)}</strong></div><div style={{ height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "999px" }}><div style={{ width: `${pct * 100}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} /></div></div>)}</GlassCard></FeatureHubPage>;
  }

  function EMICalculatorPage() {
    const [loan, setLoan] = useState(500000);
    const [rate, setRate] = useState(10);
    const [months, setMonths] = useState(60);
    const monthlyRate = rate / 12 / 100;
    const emi = monthlyRate ? loan * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1) : loan / months;
    return <FeatureHubPage title="EMI Calculator" subtitle="Estimate loan EMI, total interest, and total repayment."><GlassCard style={{ padding: "22px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}><input value={loan} onChange={e => setLoan(Number(e.target.value.replace(/\D/g, "")) || 0)} style={inputStyle} /><input value={rate} onChange={e => setRate(Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} style={inputStyle} /><input value={months} onChange={e => setMonths(Number(e.target.value.replace(/\D/g, "")) || 1)} style={inputStyle} /></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "18px" }}>{[["Monthly EMI", emi], ["Total Interest", emi * months - loan], ["Total Payable", emi * months]].map(([l, v]) => <div key={l}><p style={{ color: "rgba(255,255,255,0.55)", margin: "0 0 6px" }}>{l}</p><strong style={{ fontSize: "24px" }}>{formatCurrency(v)}</strong></div>)}</div></GlassCard></FeatureHubPage>;
  }

  function SmartInsightsPage({ transactions, bills, goals }) {
    const expenseTotal = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const overdue = bills.filter(bill => bill.status === "overdue").length;
    const behindGoal = goals.find(goal => Number(goal.current || 0) / Number(goal.target || 1) < 0.35);
    const insights = [
      { title: "Spending Check", body: `You have logged ${formatCurrency(expenseTotal)} in expenses. Review top categories in Analytics.`, color: "#FBBF24" },
      { title: "Bill Alert", body: overdue ? `${overdue} bill needs attention.` : "No overdue bills. Nice and tidy.", color: overdue ? "#F87171" : "#34D399" },
      { title: "Goal Momentum", body: behindGoal ? `${behindGoal.name} is below 35% progress. Add a small top-up this month.` : "Your active goals are moving well.", color: "#60A5FA" }
    ];
    return <FeatureHubPage title="Smart Insights" subtitle="Automated nudges based on transactions, bills, and goals."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>{insights.map(item => <GlassCard key={item.title} style={{ padding: "20px", border: `1px solid ${item.color}55` }}><h3 style={{ margin: "0 0 8px", color: item.color }}>{item.title}</h3><p style={{ margin: 0, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{item.body}</p></GlassCard>)}</div></FeatureHubPage>;
  }

  function CashPaymentsPage({ cashPayments, onAddCashPayment }) {
    const [form, setForm] = useState({ name: "", category: "Food", amount: "", date: new Date().toISOString().slice(0, 10) });
    return <FeatureHubPage title="Cash Payments" subtitle="Track cash spending and deduct it from your cash wallet."><GlassCard style={{ padding: "20px", marginBottom: "16px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}><input placeholder="Payment name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /><input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} /><input placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })} style={inputStyle} /><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></div><button onClick={async () => { await onAddCashPayment(form); setForm({ name: "", category: "Food", amount: "", date: new Date().toISOString().slice(0, 10) }); }} style={{ marginTop: "14px", padding: "13px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#2563EB,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Add Cash Payment</button></GlassCard><div style={{ display: "grid", gap: "10px" }}>{cashPayments.map(payment => <GlassCard key={payment.id} style={{ padding: "14px", display: "flex", justifyContent: "space-between", gap: "12px" }}><span>{payment.name}<small style={{ display: "block", color: "rgba(255,255,255,0.5)" }}>{payment.date} - {payment.category}</small></span><strong>{formatCurrency(payment.amount)}</strong></GlassCard>)}</div></FeatureHubPage>;
  }

  function SimpleFeaturePages({ type, subscriptions, plan, onChangePlan, paymentLoadingPlan }) {
    if (type === "subscriptions") return <FeatureHubPage title="Subscriptions" subtitle="Detect and manage recurring payments."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "14px" }}>{subscriptions.map(sub => <GlassCard key={sub.id} style={{ padding: "18px" }}><strong>{sub.name}</strong><p style={{ color: "rgba(255,255,255,0.55)" }}>{sub.category} - {sub.cycle}</p><strong>{formatCurrency(sub.amount)}</strong></GlassCard>)}</div></FeatureHubPage>;
    if (type === "investadvisor") return <FeatureHubPage title="Investment Advisor" subtitle="Suggested allocation based on a balanced risk profile."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>{[["Equity SIP", "55%"], ["Debt/FD", "25%"], ["Gold", "10%"], ["Emergency Cash", "10%"]].map(([a, b]) => <GlassCard key={a} style={{ padding: "18px" }}><p style={{ margin: "0 0 6px" }}>{a}</p><strong style={{ fontSize: "26px", color: "#60A5FA" }}>{b}</strong></GlassCard>)}</div></FeatureHubPage>;
    if (type === "aicopilot") return <FeatureHubPage title="AI Copilot" subtitle="Personalised finance prompts for budgeting, saving, tax, and investing."><GlassCard style={{ padding: "22px" }}><p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>Ask the AI Coach page for conversational guidance. Pro and Elite plans unlock unlimited usage, deeper tax guidance, and investment scenarios.</p></GlassCard></FeatureHubPage>;
    if (type === "financialai") return <FeatureHubPage title="Financial AI" subtitle="Advanced planning for tax optimisation, risk, and portfolio strategy."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>{["80C and HRA tax planner", "10-year wealth projection", "Portfolio rebalancing", "Risk assessment"].map(item => <GlassCard key={item} style={{ padding: "18px" }}><strong>{item}</strong><p style={{ color: "rgba(255,255,255,0.55)" }}>Elite-ready module</p></GlassCard>)}</div></FeatureHubPage>;
    if (type === "premium") return <FeatureHubPage title="Premium Features" subtitle="Unlock advanced AI, reports, advisor tools, and unlimited usage."><GlassCard style={{ padding: "22px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>{["Unlimited AI Copilot", "Advanced Analytics", "Tax Optimisation", "Portfolio Rebalancing", "Custom PDF Reports", "Priority Support"].map(item => <div key={item} style={{ padding: "14px", background: "rgba(255,255,255,0.06)", borderRadius: "12px" }}>{item}</div>)}</div></GlassCard></FeatureHubPage>;
    return <FeatureHubPage title="Upgrade Plan" subtitle="Choose the plan that fits your financial journey."><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "14px" }}>{[["free", "Free", 0], ["pro", "Pro", 299], ["elite", "Elite", 599]].map(([key, name, price]) => {
      const isCurrent = plan === key;
      const isLoading = paymentLoadingPlan === key;
      return <GlassCard key={key} style={{ padding: "22px", border: isCurrent ? "1px solid #60A5FA" : undefined }}><h2 style={{ margin: "0 0 8px" }}>{name}</h2><strong style={{ fontSize: "28px" }}>{price ? formatCurrency(price) + "/mo" : "Free"}</strong><button disabled={isCurrent || isLoading} onClick={() => onChangePlan(key)} style={{ marginTop: "16px", width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: isCurrent ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg,#2563EB,#059669)", color: "#fff", fontWeight: 800, cursor: isCurrent || isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.8 : 1 }}>{isCurrent ? "Current Plan" : isLoading ? "Opening checkout..." : key === "free" ? "Choose Plan" : "Pay with Razorpay"}</button></GlassCard>;
    })}</div></FeatureHubPage>;
  }

  function MorePage({ setPage }) {
    const items = [
      ["transactions", "Transactions"], ["analytics", "Analytics"], ["bills", "Bills"], ["networth", "Net Worth"],
      ["budgetplanner", "Budget Planner"], ["emicalculator", "EMI Calculator"], ["investadvisor", "Investment Advisor"],
      ["subscriptions", "Subscriptions"], ["cashpayments", "Cash Payments"], ["smartinsights", "Smart Insights"],
      ["aicopilot", "AI Copilot"], ["financialai", "Financial AI"], ["premiumfeatures", "Premium Features"], ["upgradeplan", "Upgrade Plan"], ["calculator", "Investment Calculator"],
      ["community", "Community"], ["videos", "Videos"], ["testimonials", "Testimonials"]
    ];
    return (
      <FeatureHubPage title="More" subtitle="All FinCoach tools and feature modules.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
          {items.map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", textAlign: "left", cursor: "pointer", fontWeight: 700 }}>
              {label}
            </button>
          ))}
        </div>
      </FeatureHubPage>
    );
  }

  function Dashboard() {
    const bills = [
      { icon: "📺", name: "Netflix", due: "Due Feb 20", amount: 649 },
      { icon: "⚡", name: "Electricity", due: "Due Feb 22", amount: 1200 },
      { icon: "🏋️", name: "Gym", due: "Due Feb 25", amount: 800 },
      { icon: "🌐", name: "Internet", due: "Due Mar 1", amount: 599 }
    ];

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>Good morning 👋</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "800" }}>Financial Health</h1>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", padding: "8px 14px", borderRadius: "20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px", fontSize: "13px"
            }}>🌐 English</button>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer"
            }}>
              🔔
              <div style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }}/>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <GlassCard style={{ padding: "24px", marginBottom: "20px", border: "1px solid rgba(37,99,235,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 4px" }}>February 2026</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: 0 }}>Budget Used</p>
            </div>
            <div style={{ position: "relative", width: "90px", height: "90px" }}>
              <RingProgress percent={76} size={90} stroke={9}/>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "20px", fontWeight: "800" }}>76%</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Budget</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "20px" }}>
            {[
              { label: "Income", amount: "₹25,000", icon: "↗", bg: "rgba(5,150,105,0.15)", iconColor: "#059669" },
              { label: "Spent", amount: "₹19,000", icon: "↘", bg: "rgba(239,68,68,0.15)", iconColor: "#EF4444" },
              { label: "Saved", amount: "₹2,000", icon: "🐷", bg: "rgba(180,150,40,0.15)", iconColor: "#F59E0B" }
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: "14px", padding: "14px 12px" }}>
                <span style={{ color: s.iconColor, fontSize: "16px" }}>{s.icon}</span>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "6px 0 4px" }}>{s.label}</p>
                <p style={{ color: "#fff", fontWeight: "700", fontSize: "16px", margin: 0 }}>{s.amount}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Spending Breakdown */}
        <GlassCard style={{ padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Spending Breakdown</h3>
            <span style={{
              background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)",
              color: "#60A5FA", padding: "4px 12px", borderRadius: "20px", fontSize: "12px"
            }}>Feb 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <DonutChart essentials={14000} nonEssentials={5000} />
            <div style={{ flex: 1 }}>
              {[
                { label: "Essentials", amount: "₹14,000", color: "#2563EB", pct: 74 },
                { label: "Non-Essentials", amount: "₹5,000", color: "#059669", pct: 26 }
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: i === 0 ? "16px" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color }}/>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{s.label}</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>{s.amount}</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: "4px", transition: "width 1s ease" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Upcoming Bills */}
        <GlassCard style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Upcoming Bills</h3>
            <span style={{ color: "#2563EB", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
          </div>
          {bills.map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", padding: "14px 0",
              borderBottom: i < bills.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "20px", marginRight: "14px"
              }}>{b.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "15px" }}>{b.name}</p>
                <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{b.due}</p>
              </div>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>₹{b.amount.toLocaleString()}</span>
            </div>
          ))}
        </GlassCard>
      </div>
    );
  }

  function DashboardLive({ profile, accounts, transactions, totalBalance, billsData, goalsData, setPage }) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const transactionMonths = [...new Set(transactions.map(tx => String(tx.date || "").slice(0, 7)).filter(Boolean))].sort();
    const activeMonth = transactionMonths.includes(currentMonth)
      ? currentMonth
      : (transactionMonths[transactionMonths.length - 1] || currentMonth);
    const activeMonthTransactions = transactions.filter(tx => String(tx.date || "").startsWith(activeMonth));
    const income = activeMonthTransactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const expenses = activeMonthTransactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const savings = income - expenses;
    const monthlyIncomeTarget = Number(profile?.monthlyIncome || 0) || income || 1;
    const budgetUsedPercent = Math.max(0, Math.min(100, Math.round((expenses / monthlyIncomeTarget) * 100)));
    const bankBalance = accounts.filter(account => account.type === "bank").reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const cashBalance = accounts.filter(account => account.type === "cash").reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const essentialsCategories = new Set(["Bills", "Health", "Transport", "Groceries", "Rent", "Utilities", "Food"]);
    const essentials = activeMonthTransactions
      .filter(tx => tx.type === "expense")
      .reduce((sum, tx) => sum + (essentialsCategories.has(tx.category) ? Number(tx.amount || 0) : 0), 0);
    const nonEssentials = Math.max(0, expenses - essentials);
    const [activeYear, activeMonthIndex] = activeMonth.split("-");
    const monthLabel = new Date(Number(activeYear), Math.max(0, Number(activeMonthIndex || 1) - 1), 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const upcomingBills = [...(billsData || [])]
      .filter(bill => bill.status !== "paid")
      .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")))
      .slice(0, 4);
    const topGoal = [...(goalsData || [])]
      .sort((a, b) => (Number(b.current || 0) / Math.max(1, Number(b.target || 1))) - (Number(a.current || 0) / Math.max(1, Number(a.target || 1))))
      [0];
    const topGoalPercent = topGoal ? Math.min(100, Math.round((Number(topGoal.current || 0) / Math.max(1, Number(topGoal.target || 1))) * 100)) : 0;

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>Good morning {(profile?.name || "").trim() ? `${profile.name} ` : ""}👋</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "28px", fontWeight: "800" }}>Financial Health</h1>
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", alignSelf: "center" }}>{monthLabel}</div>
        </div>

        <GlassCard style={{ padding: "24px", marginBottom: "20px", border: "1px solid rgba(37,99,235,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 4px" }}>{monthLabel}</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", margin: 0 }}>Budget Used</p>
            </div>
            <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
              <RingProgress percent={budgetUsedPercent} size={90} stroke={9}/>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "20px", fontWeight: "800" }}>{budgetUsedPercent}%</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Budget</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginTop: "20px" }}>
            {[
              { label: "Income", amount: formatCurrency(income), icon: "↗", bg: "rgba(5,150,105,0.15)", iconColor: "#059669" },
              { label: "Spent", amount: formatCurrency(expenses), icon: "↘", bg: "rgba(239,68,68,0.15)", iconColor: "#EF4444" },
              { label: "Saved", amount: formatCurrency(savings), icon: "₹", bg: "rgba(180,150,40,0.15)", iconColor: "#F59E0B" }
            ].map((item, index) => (
              <div key={index} style={{ background: item.bg, borderRadius: "14px", padding: "14px 12px" }}>
                <span style={{ color: item.iconColor, fontSize: "16px" }}>{item.icon}</span>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", margin: "6px 0 4px" }}>{item.label}</p>
                <p style={{ color: "#fff", fontWeight: "700", fontSize: "16px", margin: 0 }}>{item.amount}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "18px", color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
            <span>Total balance: <strong style={{ color: "#fff" }}>{formatCurrency(totalBalance)}</strong></span>
            <span>Bank: <strong style={{ color: "#fff" }}>{formatCurrency(bankBalance)}</strong></span>
            <span>Cash: <strong style={{ color: "#fff" }}>{formatCurrency(cashBalance)}</strong></span>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Spending Breakdown</h3>
            <span style={{
              background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)",
              color: "#60A5FA", padding: "4px 12px", borderRadius: "20px", fontSize: "12px"
            }}>{monthLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <DonutChart essentials={essentials} nonEssentials={nonEssentials} />
            <div style={{ flex: 1, minWidth: "220px" }}>
              {[
                { label: "Essentials", amount: formatCurrency(essentials), color: "#2563EB", pct: expenses ? Math.round((essentials / expenses) * 100) : 0 },
                { label: "Non-Essentials", amount: formatCurrency(nonEssentials), color: "#059669", pct: expenses ? Math.round((nonEssentials / expenses) * 100) : 0 }
              ].map((item, index) => (
                <div key={index} style={{ marginBottom: index === 0 ? "16px" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }}/>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>{item.label}</span>
                    </div>
                    <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>{item.amount}</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                    <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: "4px", transition: "width 1s ease" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {!expenses && <p style={{ color: "rgba(255,255,255,0.5)", margin: "16px 0 0", fontSize: "13px" }}>Add transactions to see your live monthly spending mix.</p>}
        </GlassCard>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <GlassCard style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Upcoming Bills</h3>
              <span onClick={() => setPage("bills")} style={{ color: "#2563EB", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
            </div>
            {upcomingBills.length ? upcomingBills.map((bill, index) => (
              <div key={bill.id || index} style={{
                display: "flex", alignItems: "center", padding: "14px 0",
                borderBottom: index < upcomingBills.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
              }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "20px", marginRight: "14px"
                }}>{bill.status === "overdue" ? "!" : "₹"}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "15px" }}>{bill.name}</p>
                  <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Due {bill.due}</p>
                </div>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>{formatCurrency(bill.amount)}</span>
              </div>
            )) : <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No unpaid bills right now.</p>}
          </GlassCard>

          <GlassCard style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Goal Progress</h3>
              <span onClick={() => setPage("goals")} style={{ color: "#2563EB", fontSize: "13px", cursor: "pointer" }}>See all ›</span>
            </div>
            {topGoal ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <strong>{topGoal.name}</strong>
                  <span>{topGoalPercent}%</span>
                </div>
                <div style={{ height: "9px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", marginBottom: "12px" }}>
                  <div style={{ width: `${topGoalPercent}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#2563EB,#059669)" }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>{formatCurrency(topGoal.current)} of {formatCurrency(topGoal.target)}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", margin: 0, fontSize: "13px" }}>{topGoal.deadline ? `Target date: ${topGoal.deadline}` : "No deadline set yet."}</p>
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Create a goal to track live progress here.</p>
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  // ─── AI COACH ─────────────────────────────────────────────────────────────
  function AICoach() {
    const [messages, setMessages] = useState([
      { role: "ai", text: "Hello! I'm your FinCoach AI. Based on your spending this month, you've used 76% of your budget. Would you like some tips to save more?" },
    ]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);

    const aiResponses = [
      "Great question! Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      "Based on your spending, you could save ₹3,000 by cutting non-essential subscriptions.",
      "I recommend investing ₹2,000/month in a SIP. Over 10 years at 12%, that's ₹4.6 lakhs!",
      "Your Netflix, Gym, and Internet bills total ₹2,048. Consider bundling services to save.",
      "Your savings rate is 8%. Aim for 20% — try automating transfers on payday!"
    ];

    const send = () => {
      if (!input.trim()) return;
      const userMsg = input;
      setMessages(m => [...m, { role: "user", text: userMsg }]);
      setInput("");
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(m => [...m, { role: "ai", text: aiResponses[Math.floor(Math.random() * aiResponses.length)] }]);
      }, 1500);
    };

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui", height: "100%" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: "26px", fontWeight: "800" }}>🧠 AI Financial Coach</h1>
        <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {["💡 Save Tips", "📊 Budget Check", "📈 Investment Advice", "🎯 Goal Plan"].map(t => (
              <button key={t} onClick={() => setInput(t.replace(/[💡📊📈🎯] /,""))} style={{
                background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
                color: "#60A5FA", padding: "8px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px"
              }}>{t}</button>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: "20px", marginBottom: "16px", minHeight: "350px", maxHeight: "400px", overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "16px", animation: "fadeUp 0.3s ease"
            }}>
              {m.role === "ai" && (
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #2563EB, #059669)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginRight: "10px", fontSize: "16px"
                }}>✦</div>
              )}
              <div style={{
                maxWidth: "75%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
                color: "#fff", fontSize: "14px", lineHeight: "1.6"
              }}>{m.text}</div>
            </div>
          ))}
          {typing && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
              }}>✦</div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "12px 16px", borderRadius: "16px", display: "flex", gap: "4px" }}>
                {[0,1,2].map(d => <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", animation: `typing 1s ${d*0.2}s infinite` }}/>)}
              </div>
            </div>
          )}
        </GlassCard>

        <div style={{ display: "flex", gap: "10px" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask your AI coach..." style={{...inputStyle, flex: 1, margin: 0}} />
          <button onClick={send} style={{
            padding: "14px 20px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg, #2563EB, #059669)",
            color: "#fff", cursor: "pointer", fontSize: "18px"
          }}>➤</button>
        </div>
      </div>
    );
  }

  // ─── GOALS ────────────────────────────────────────────────────────────────
  function Goals() {
    const [showAdd, setShowAdd] = useState(false);
    const [goals, setGoals] = useState([
      { name: "Emergency Fund", target: 50000, current: 32000, icon: "🛡️", deadline: "Jun 2026" },
      { name: "New Laptop", target: 80000, current: 15000, icon: "💻", deadline: "Dec 2026" },
      { name: "Vacation Goa", target: 30000, current: 28500, icon: "🏖️", deadline: "Mar 2026" },
      { name: "Stock Portfolio", target: 100000, current: 45000, icon: "📈", deadline: "Dec 2026" }
    ]);
    const [newGoal, setNewGoal] = useState({ name: "", target: "", icon: "🎯" });

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>🎯 My Goals</h1>
          <button onClick={() => setShowAdd(true)} style={{
            background: "linear-gradient(135deg, #2563EB, #059669)",
            border: "none", color: "#fff", padding: "10px 18px", borderRadius: "12px",
            cursor: "pointer", fontSize: "14px", fontWeight: "600"
          }}>+ Add Goal</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {goals.map((g, i) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <GlassCard key={i} style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontSize: "28px" }}>{g.icon}</span>
                    <h3 style={{ margin: "8px 0 4px", fontSize: "16px" }}>{g.name}</h3>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Due {g.deadline}</p>
                  </div>
                  <div style={{ position: "relative", width: "70px", height: "70px" }}>
                    <RingProgress percent={pct} size={70} stroke={7}/>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700" }}>{pct}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>₹{g.current.toLocaleString()}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>₹{g.target.toLocaleString()}</span>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #2563EB, #059669)", borderRadius: "4px" }}/>
                </div>
                {pct === 100 && <div style={{ textAlign: "center", marginTop: "12px", color: "#F59E0B" }}>🎉 Goal Achieved!</div>}
              </GlassCard>
            );
          })}
        </div>

        {showAdd && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <GlassCard style={{ padding: "32px", width: "min(400px, 90vw)" }}>
              <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: "20px" }}>Add New Goal</h3>
              <input placeholder="Goal Name" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} style={{...inputStyle, marginBottom: "12px"}}/>
              <input placeholder="Target Amount (₹)" type="number" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} style={{...inputStyle, marginBottom: "16px"}}/>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => { setGoals([...goals, { name: newGoal.name, target: +newGoal.target, current: 0, icon: newGoal.icon, deadline: "Dec 2026" }]); setShowAdd(false); setNewGoal({ name: "", target: "", icon: "🎯" }); }} style={{
                  flex: 1, padding: "14px", borderRadius: "12px", border: "none",
                  background: "linear-gradient(135deg, #2563EB, #059669)", color: "#fff", cursor: "pointer", fontWeight: "700"
                }}>Add Goal</button>
                <button onClick={() => setShowAdd(false)} style={{
                  flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)",
                  background: "none", color: "#fff", cursor: "pointer"
                }}>Cancel</button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  // ─── INVESTMENT CALCULATOR ─────────────────────────────────────────────────
  function Calculator() {
    const [mode, setMode] = useState("years");
    const [initial, setInitial] = useState(10000);
    const [sip, setSip] = useState(5000);
    const [years, setYears] = useState(10);
    const [rate, setRate] = useState(12);
    const [tax, setTax] = useState(false);
    const [inflation, setInflation] = useState(false);

    const riskLabel = rate <= 5 ? { label: "Conservative", color: "#2563EB" }
      : rate <= 8 ? { label: "Moderate", color: "#059669" }
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

    const fmt = (n) => {
      if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
      if (n >= 100000) return `₹${(n/100000).toFixed(2)} L`;
      return `₹${Math.round(n).toLocaleString()}`;
    };

    const chartData = Array.from({ length: years }, (_, i) => {
      const yr = i + 1, nYr = n * yr;
      return initial * Math.pow(1 + rn, nYr) + sip * ((Math.pow(1 + rn, nYr) - 1) / rn);
    });
    const maxVal = Math.max(...chartData);

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: "26px", fontWeight: "800" }}>📊 Investment Calculator</h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[["years","By Years"], ["age","By Age"], ["goal","Goal-Based"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px",
              background: mode === m ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
              color: "#fff", fontWeight: mode === m ? "700" : "400"
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <GlassCard style={{ padding: "24px", marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "15px", color: "rgba(255,255,255,0.7)" }}>Investment Inputs</h3>
              {[
                { label: "Initial Investment (₹)", val: initial, set: setInitial, min: 0, max: 1000000, step: 1000 },
                { label: "Monthly SIP (₹)", val: sip, set: setSip, min: 0, max: 100000, step: 500 },
                { label: `Timeframe (${years} years)`, val: years, set: setYears, min: 1, max: 40, step: 1 }
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{f.label}</label>
                    <span style={{ fontWeight: "700", color: "#60A5FA", fontSize: "14px" }}>
                      {i < 2 ? `₹${Number(f.val).toLocaleString()}` : `${f.val} yrs`}
                    </span>
                  </div>
                  <input type="range" min={f.min} max={f.max} step={f.step} value={f.val}
                    onChange={e => f.set(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#2563EB" }} />
                </div>
              ))}

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>Expected Return</label>
                  <span style={{ fontWeight: "700", color: riskLabel.color, fontSize: "14px" }}>{rate}% — {riskLabel.label}</span>
                </div>
                <input type="range" min={1} max={20} step={0.5} value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  style={{ width: "100%", accentColor: riskLabel.color }} />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                {[["Tax (10% LTCG)", tax, setTax], ["Inflation (6%)", inflation, setInflation]].map(([l, v, s], i) => (
                  <button key={i} onClick={() => s(!v)} style={{
                    flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer",
                    background: v ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: "12px", fontWeight: "600"
                  }}>{l}</button>
                ))}
              </div>
            </GlassCard>
          </div>

          <div>
            <GlassCard style={{ padding: "24px", marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "rgba(255,255,255,0.7)" }}>Projection</h3>
              {/* Mini chart */}
              <div style={{ height: "120px", display: "flex", alignItems: "flex-end", gap: "4px", marginBottom: "20px" }}>
                {chartData.map((v, i) => (
                  <div key={i} style={{
                    flex: 1, background: `linear-gradient(0deg, #2563EB, #059669)`,
                    borderRadius: "3px 3px 0 0", opacity: 0.7 + (i / chartData.length) * 0.3,
                    height: `${(v / maxVal) * 100}%`, transition: "height 0.5s ease", minHeight: "4px"
                  }} title={fmt(v)} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Final Value", val: fmt(fv), color: "#059669" },
                  { label: "Total Invested", val: fmt(totalInvested), color: "#60A5FA" },
                  { label: "Interest Earned", val: fmt(interestEarned), color: "#F59E0B" },
                  { label: "CAGR", val: `${Math.abs(cagr).toFixed(1)}%`, color: "#A78BFA" }
                ].map((r, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "12px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{r.label}</p>
                    <p style={{ margin: 0, fontWeight: "800", fontSize: "16px", color: r.color }}>{r.val}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard style={{ padding: "20px", background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: "#60A5FA" }}>💡 Smart Suggestion</p>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.5" }}>
                Increasing your SIP by ₹1,000/month could add an extra {fmt(sip * 12 * years * 0.3)} to your corpus over {years} years!
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // ─── COMMUNITY ─────────────────────────────────────────────────────────────
  function Community() {
    const [activeTab, setActiveTab] = useState("Finance");
    const tabs = ["Features", "Investments", "Finance", "Goals", "Tips"];
    const posts = [
      { avatar: "RK", name: "Rahul K.", content: "Started my first SIP at 22. Now at 30, my portfolio is 12L! Consistency is key 🚀", tags: ["SIP", "Investment"], likes: 234, comments: 45, time: "2h ago" },
      { avatar: "PS", name: "Priya S.", content: "FinCoach helped me save ₹50,000 in just 6 months! The AI suggestions are game-changing 💚", tags: ["Savings", "AI"], likes: 189, comments: 32, time: "4h ago" },
      { avatar: "AM", name: "Arjun M.", content: "Emergency fund complete! 6 months expenses saved. Now moving to aggressive investing 📈", tags: ["Goals", "Emergency"], likes: 156, comments: 28, time: "6h ago" },
      { avatar: "SS", name: "Sneha S.", content: "Mutual funds vs FD debate: At 12% CAGR vs 7% FD, the math is clear. Start your SIP today!", tags: ["MF", "Tips"], likes: 312, comments: 67, time: "1d ago" }
    ];

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <h1 style={{ margin: "0 0 20px", fontSize: "26px", fontWeight: "800" }}>👥 Community</h1>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "8px 18px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap",
              background: activeTab === t ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
              color: "#fff"
            }}>{t}</button>
          ))}
        </div>
        {posts.map((p, i) => (
          <GlassCard key={i} style={{ padding: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "700", fontSize: "14px"
              }}>{p.avatar}</div>
              <div>
                <p style={{ margin: 0, fontWeight: "600" }}>{p.name}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{p.time}</p>
              </div>
            </div>
            <p style={{ margin: "0 0 12px", lineHeight: "1.6", color: "rgba(255,255,255,0.85)" }}>{p.content}</p>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {p.tags.map(t => (
                <span key={t} style={{
                  background: "rgba(37,99,235,0.2)", color: "#60A5FA",
                  padding: "3px 10px", borderRadius: "20px", fontSize: "12px"
                }}>#{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              {[`❤️ ${p.likes}`, `💬 ${p.comments}`, "↗️ Share"].map((a, j) => (
                <button key={j} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                  cursor: "pointer", fontSize: "13px", padding: 0
                }}>{a}</button>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  // ─── VIDEOS ───────────────────────────────────────────────────────────────
  function Videos() {
    const [filter, setFilter] = useState("All");
    const videos = [
      { title: "Master the 50/30/20 Rule", duration: "8:24", category: "Budgeting", emoji: "💰", views: "12K" },
      { title: "SIP vs Lumpsum: Which Wins?", duration: "12:15", category: "Investing", emoji: "📈", views: "28K" },
      { title: "Emergency Fund Strategy", duration: "6:42", category: "Goals", emoji: "🛡️", views: "9K" },
      { title: "Tax Saving Under 80C", duration: "15:30", category: "Investing", emoji: "📋", views: "45K" },
      { title: "Budgeting for Beginners", duration: "10:05", category: "Budgeting", emoji: "📊", views: "31K" },
      { title: "Goal-Based Investing", duration: "9:18", category: "Goals", emoji: "🎯", views: "17K" }
    ];
    const filters = ["All", "Budgeting", "Investing", "Goals"];
    const filtered = filter === "All" ? videos : videos.filter(v => v.category === filter);

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <GlassCard style={{ padding: "20px", marginBottom: "20px", background: "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(5,150,105,0.2))", textAlign: "center" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "20px" }}>📚 Personalized Financial Insights</h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>Curated videos based on your financial profile</p>
        </GlassCard>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 18px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px",
              background: filter === f ? "linear-gradient(135deg, #2563EB, #059669)" : "rgba(255,255,255,0.08)",
              color: "#fff"
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {filtered.map((v, i) => (
            <GlassCard key={i} style={{ overflow: "hidden", cursor: "pointer" }}>
              <div style={{
                height: "140px", background: `linear-gradient(135deg, #0D1B3E, #071520)`,
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: "56px"
              }}>
                {v.emoji}
                <div style={{
                  position: "absolute", bottom: "8px", right: "8px",
                  background: "rgba(0,0,0,0.8)", color: "#fff", padding: "3px 8px",
                  borderRadius: "6px", fontSize: "12px"
                }}>{v.duration}</div>
              </div>
              <div style={{ padding: "16px" }}>
                <p style={{ margin: "0 0 8px", fontWeight: "600", fontSize: "14px" }}>{v.title}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#60A5FA" }}>{v.category}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>👁 {v.views}</span>
                </div>
                <button style={{
                  width: "100%", marginTop: "12px", padding: "10px", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg, #2563EB, #059669)",
                  color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                }}>▶ Watch Now</button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  // ─── TESTIMONIALS ──────────────────────────────────────────────────────────
  function Testimonials() {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", summary: "", before: "", after: "", feature: "", rating: 5 });
    const [submitted, setSubmitted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [testimonials, setTestimonials] = useState([
      { initials: "RK", summary: "Saved ₹1.2L in 8 months with AI coaching!", before: "5K", after: "15K", feature: "AI Coach", rating: 5, likes: 234, badge: "🏆 FinCoach Champion" },
      { initials: "PS", summary: "Hit my first ₹1 Lakh savings milestone!", before: "2K", after: "12K", feature: "Goals", rating: 5, likes: 189, badge: "🌟 Top Saver" },
      { initials: "AM", summary: "Investment portfolio grew 3x in 2 years", before: "10K", after: "30K", feature: "Calculator", rating: 4, likes: 156, badge: "💬 Storyteller" },
      { initials: "NT", summary: "Finally understand where my money goes!", before: "0", after: "8K", feature: "Dashboard", rating: 5, likes: 142, badge: "🌟 Top Saver" }
    ]);

    const handleSubmit = () => {
      if (!form.summary) return;
      setTestimonials([{ initials: form.name.slice(0,2).toUpperCase() || "AN", ...form, likes: 0, badge: "💬 Storyteller", isNew: true }, ...testimonials]);
      setShowConfetti(true); setSubmitted(true);
      setTimeout(() => { setShowConfetti(false); setShowForm(false); setSubmitted(false); setForm({ name: "", summary: "", before: "", after: "", feature: "", rating: 5 }); }, 3000);
    };

    return (
      <div style={{ color: "#fff", fontFamily: "system-ui" }}>
        <Confetti show={showConfetti} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800" }}>⭐ Success Stories</h1>
          <button onClick={() => setShowForm(true)} style={{
            background: "linear-gradient(135deg, #2563EB, #059669)",
            border: "none", color: "#fff", padding: "10px 18px", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "600"
          }}>+ Share Story</button>
        </div>

        {/* Stats */}
        <GlassCard style={{ padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center" }}>
            {[["₹8.5 Cr", "Total Saved"], ["3,200+", "Goals Achieved"], ["4.8★", "Avg Rating"]].map(([val, label]) => (
              <div key={label}>
                <p style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", color: "#2563EB" }}>{val}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{label}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {testimonials.map((t, i) => (
            <GlassCard key={i} style={{ padding: "20px", animation: t.isNew ? "fadeUp 0.5s ease" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563EB, #059669)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px"
                }}>{t.initials}</div>
                <div>
                  <div style={{ display: "flex", gap: "2px" }}>{"⭐".repeat(t.rating)}</div>
                  <span style={{ fontSize: "12px", color: "#F59E0B" }}>{t.badge}</span>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", lineHeight: "1.6", color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>"{t.summary}"</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <div style={{ flex: 1, background: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Before</p>
                  <p style={{ margin: 0, fontWeight: "700", color: "#EF4444" }}>₹{t.before}/mo</p>
                </div>
                <div style={{ flex: 1, background: "rgba(5,150,105,0.1)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>After</p>
                  <p style={{ margin: 0, fontWeight: "700", color: "#059669" }}>₹{t.after}/mo</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px" }}>❤️ {t.likes}</button>
                <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px" }}>👍 Inspired</button>
                <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px" }}>💬 Comment</button>
              </div>
            </GlassCard>
          ))}
        </div>

        {showForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
            <GlassCard style={{ padding: "32px", width: "min(480px, 100%)", maxHeight: "90vh", overflowY: "auto" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: "60px", marginBottom: "16px" }}>🎉</div>
                  <h3 style={{ color: "#fff", margin: "0 0 8px" }}>Story Shared!</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>You've inspired the community!</p>
                </div>
              ) : (
                <>
                  <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: "20px" }}>Share Your Journey</h3>
                  <input placeholder="Your Name (optional)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{...inputStyle, marginBottom: "12px"}}/>
                  <textarea placeholder="Your success summary..." value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} style={{...inputStyle, marginBottom: "12px", height: "80px", resize: "none"}}/>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                    <input placeholder="Before savings ₹/mo" value={form.before} onChange={e => setForm({...form, before: e.target.value})} style={{...inputStyle, flex: 1}}/>
                    <input placeholder="After savings ₹/mo" value={form.after} onChange={e => setForm({...form, after: e.target.value})} style={{...inputStyle, flex: 1}}/>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "8px", display: "block" }}>Rating</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setForm({...form, rating: s})} style={{
                          background: "none", border: "none", cursor: "pointer", fontSize: "24px", opacity: s <= form.rating ? 1 : 0.3
                        }}>⭐</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleSubmit} style={{
                      flex: 1, padding: "14px", borderRadius: "12px", border: "none",
                      background: "linear-gradient(135deg, #2563EB, #059669)", color: "#fff", cursor: "pointer", fontWeight: "700"
                    }}>Submit Story</button>
                    <button onClick={() => setShowForm(false)} style={{
                      padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)",
                      background: "none", color: "#fff", cursor: "pointer"
                    }}>✕</button>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  // ─── APP SHELL ─────────────────────────────────────────────────────────────
  export default function App() {
    const [authState, setAuthState] = useState("login"); // login | onboarding | app
    const [page, setPage] = useState("dashboard");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [profile, setProfile] = useState(defaultProfile);
    const [plan, setPlan] = useState("free");
    const [accounts, setAccounts] = useState([
      { id: "acct-1", name: "Savings Account", type: "bank", subtype: "savings", balance: 24500, bankName: "Axis Bank", ifsc: "UTIB0001234" },
      { id: "acct-2", name: "Cash Wallet", type: "cash", balance: 5200 }
    ]);
    const [transactions, setTransactions] = useState([
      { id: "txn-1", date: "2026-02-14", type: "income", accountId: "acct-1", amount: 12000, description: "Salary credited" },
      { id: "txn-2", date: "2026-02-18", type: "expense", accountId: "acct-1", amount: 649, description: "Netflix subscription" },
      { id: "txn-3", date: "2026-02-19", type: "transfer", fromId: "acct-1", toId: "acct-2", amount: 2000, description: "Wallet top-up" }
    ]);
    const [goalsData, setGoalsData] = useState([]);
    const [billsData, setBillsData] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [cashPayments, setCashPayments] = useState([]);
    const [accountModal, setAccountModal] = useState({ open: false, account: null });
    const [transferState, setTransferState] = useState({ fromId: "acct-1", toId: "acct-2", amount: "", error: "", success: "" });
    const [pdfFilter, setPdfFilter] = useState({ startDate: "", endDate: "", accountId: "all" });
    const [statusMessage, setStatusMessage] = useState("");
    const [paymentLoadingPlan, setPaymentLoadingPlan] = useState("");
    const exportRef = useRef(null);

    const resetSession = message => {
      localStorage.removeItem("fincoach_token");
      setAuthState("login");
      setStatusMessage(message || "");
    };

    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);

    const filteredTransactions = transactions.filter(transaction => {
      if (pdfFilter.accountId !== "all") {
        const belongsToAccount = transaction.accountId === pdfFilter.accountId || transaction.fromId === pdfFilter.accountId || transaction.toId === pdfFilter.accountId;
        if (!belongsToAccount) return false;
      }
      if (pdfFilter.startDate && transaction.date < pdfFilter.startDate) return false;
      if (pdfFilter.endDate && transaction.date > pdfFilter.endDate) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));

    const handleSaveAccount = async account => {
      try {
        const saved = account.id
          ? await apiRequest(`/api/accounts/${encodeURIComponent(account.id)}`, { method: "PUT", body: JSON.stringify(account) })
          : await apiRequest("/api/accounts", { method: "POST", body: JSON.stringify(account) });
        setAccounts(items => account.id
          ? items.map(item => item.id === account.id ? saved.account : item)
          : [...items, saved.account]
        );
        setStatusMessage("");
        setAccountModal({ open: false, account: null });
      } catch (error) {
        setStatusMessage(`Backend unavailable, saved locally only. ${error.message}`);
        if (account.id) {
          setAccounts(items => items.map(item => item.id === account.id ? { ...item, ...account } : item));
        } else {
          setAccounts(items => [...items, { ...account, id: `acct-${Date.now()}` }]);
        }
        setAccountModal({ open: false, account: null });
      }
    };

    const handleDeleteAccount = async id => {
      const applyDelete = () => {
        setAccounts(items => items.filter(item => item.id !== id));
        setTransactions(items => items.map(tx => {
        if (tx.accountId === id) return { ...tx, accountId: "deleted" };
        if (tx.fromId === id) return { ...tx, fromId: "deleted" };
        if (tx.toId === id) return { ...tx, toId: "deleted" };
        return tx;
        }));
        setTransferState(prev => ({ ...prev, fromId: prev.fromId === id ? "" : prev.fromId, toId: prev.toId === id ? "" : prev.toId }));
      };
      try {
        const result = await apiRequest(`/api/accounts/${encodeURIComponent(id)}`, { method: "DELETE" });
        setAccounts(result.accounts);
        setTransactions(result.transactions);
        setStatusMessage("");
      } catch (error) {
        setStatusMessage(`Backend unavailable, deleted locally only. ${error.message}`);
        applyDelete();
      }
    };

    const handleSaveProfile = async nextProfile => {
      try {
        const result = await apiRequest("/api/profile", {
          method: "PUT",
          body: JSON.stringify(nextProfile)
        });
        setProfile(result.profile);
        setStatusMessage("");
      } catch (error) {
        if (error.status === 401) {
          resetSession("Your session expired. Please log in again.");
          return;
        }
        setProfile(nextProfile);
        setStatusMessage(`Backend unavailable, profile saved locally only. ${error.message}`);
      }
    };

    const handleCompleteOnboarding = async surveyProfile => {
      const payload = {
        ...profile,
        ...surveyProfile,
        phone: String(profile?.phone || "").replace(/\D/g, "").slice(0, 10),
        email: String(profile?.email || "").trim(),
        onboardingCompleted: true
      };

      try {
        const result = await apiRequest("/api/profile", {
          method: "PUT",
          body: JSON.stringify(payload)
        });

        setProfile(result.profile);
        setStatusMessage("");
        setAuthState("app");
      } catch (error) {
        if (error.status === 401) {
          resetSession("Please log in to continue.");
          throw error;
        }
        throw error;
      }
    };

    const handleAddTransaction = async transaction => {
      if (!transaction.description?.trim()) throw new Error("Transaction description is required.");
      const amount = Number(transaction.amount);
      if (!amount || amount <= 0) throw new Error("Enter a valid amount.");
      try {
        const result = await apiRequest("/api/transactions", { method: "POST", body: JSON.stringify(transaction) });
        setAccounts(result.accounts);
        setTransactions(result.transactions);
        setStatusMessage("");
      } catch (error) {
        const local = { ...transaction, id: `txn-${Date.now()}`, amount, category: transaction.category || "Others" };
        setTransactions(items => [local, ...items]);
        setAccounts(items => items.map(account => account.id === transaction.accountId ? { ...account, balance: account.balance + (transaction.type === "income" ? amount : -amount) } : account));
        setStatusMessage(`Backend unavailable, transaction saved locally only. ${error.message}`);
      }
    };

    const handleDeleteTransaction = async id => {
      try {
        const result = await apiRequest(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
        setTransactions(result.transactions);
        setStatusMessage("");
      } catch (error) {
        setTransactions(items => items.filter(item => item.id !== id));
        setStatusMessage(`Backend unavailable, transaction deleted locally only. ${error.message}`);
      }
    };

    const handleAddGoal = async goal => {
      try {
        const result = await apiRequest("/api/goals", { method: "POST", body: JSON.stringify(goal) });
        setGoalsData(result.goals);
        setStatusMessage("");
      } catch (error) {
        setGoalsData(items => [...items, { ...goal, id: `goal-${Date.now()}`, current: Number(goal.current || 0), target: Number(goal.target || 0) }]);
        setStatusMessage(`Backend unavailable, goal saved locally only. ${error.message}`);
      }
    };

    const handleFundGoal = async (id, amount) => {
      try {
        const result = await apiRequest(`/api/goals/${encodeURIComponent(id)}/fund`, { method: "PUT", body: JSON.stringify({ amount }) });
        setGoalsData(result.goals);
        setStatusMessage("");
      } catch (error) {
        const value = Number(amount || 0);
        setGoalsData(items => items.map(goal => goal.id === id ? { ...goal, current: Math.min(goal.target, Number(goal.current || 0) + value) } : goal));
        setStatusMessage(`Backend unavailable, goal funded locally only. ${error.message}`);
      }
    };

    const handleDeleteGoal = async id => {
      try {
        const result = await apiRequest(`/api/goals/${encodeURIComponent(id)}`, { method: "DELETE" });
        setGoalsData(result.goals);
        setStatusMessage("");
      } catch (error) {
        setGoalsData(items => items.filter(item => item.id !== id));
        setStatusMessage(`Backend unavailable, goal deleted locally only. ${error.message}`);
      }
    };

    const handleAddBill = async bill => {
      try {
        const result = await apiRequest("/api/bills", { method: "POST", body: JSON.stringify(bill) });
        setBillsData(result.bills);
        setStatusMessage("");
      } catch (error) {
        setBillsData(items => [...items, { ...bill, id: `bill-${Date.now()}`, amount: Number(bill.amount || 0) }]);
        setStatusMessage(`Backend unavailable, bill saved locally only. ${error.message}`);
      }
    };

    const handlePayBill = async id => {
      try {
        const result = await apiRequest(`/api/bills/${encodeURIComponent(id)}/pay`, { method: "PUT" });
        setBillsData(result.bills);
        setStatusMessage("");
      } catch (error) {
        setBillsData(items => items.map(bill => bill.id === id ? { ...bill, status: "paid" } : bill));
        setStatusMessage(`Backend unavailable, bill updated locally only. ${error.message}`);
      }
    };

    const handleDeleteBill = async id => {
      try {
        const result = await apiRequest(`/api/bills/${encodeURIComponent(id)}`, { method: "DELETE" });
        setBillsData(result.bills);
        setStatusMessage("");
      } catch (error) {
        setBillsData(items => items.filter(item => item.id !== id));
        setStatusMessage(`Backend unavailable, bill deleted locally only. ${error.message}`);
      }
    };

    const handleAddCashPayment = async payment => {
      try {
        const result = await apiRequest("/api/cash-payments", { method: "POST", body: JSON.stringify(payment) });
        setCashPayments(result.cashPayments);
        setAccounts(result.accounts);
        setTransactions(result.transactions);
        setStatusMessage("");
      } catch (error) {
        setCashPayments(items => [{ ...payment, id: `cash-${Date.now()}`, amount: Number(payment.amount || 0) }, ...items]);
        setStatusMessage(`Backend unavailable, cash payment saved locally only. ${error.message}`);
      }
    };

    const handleChangePlan = async nextPlan => {
      if (nextPlan === plan) return;

      if (nextPlan === "free") {
        try {
          const result = await apiRequest("/api/plan", { method: "PUT", body: JSON.stringify({ plan: nextPlan }) });
          setPlan(result.plan);
          setStatusMessage("Plan updated to Free.");
        } catch (error) {
          setPlan(nextPlan);
          setStatusMessage(`Backend unavailable, plan changed locally only. ${error.message}`);
        }
        return;
      }

      setPaymentLoadingPlan(nextPlan);
      try {
        const razorpayReady = await loadRazorpayScript();
        if (!razorpayReady) {
          throw new Error("Razorpay checkout failed to load.");
        }

        const orderResponse = await apiRequest("/api/payments/create-order", {
          method: "POST",
          body: JSON.stringify({ plan: nextPlan })
        });

        const paymentResult = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: orderResponse.key,
            amount: orderResponse.order.amount,
            currency: orderResponse.order.currency,
            name: "FinCoach.AI",
            description: `${orderResponse.plan.name} plan subscription`,
            order_id: orderResponse.order.id,
            prefill: {
              name: profile?.name || "",
              email: profile?.email || "",
              contact: profile?.phone || ""
            },
            notes: orderResponse.order.notes,
            theme: {
              color: "#2563EB"
            },
            handler: async response => {
              try {
                const verification = await apiRequest("/api/payments/verify", {
                  method: "POST",
                  body: JSON.stringify({
                    plan: nextPlan,
                    ...response
                  })
                });
                resolve(verification);
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment was cancelled before completion."))
            }
          });

          razorpay.open();
        });

        setPlan(paymentResult.plan);
        setStatusMessage(`${orderResponse.plan.name} plan activated successfully.`);
      } catch (error) {
        setStatusMessage(error.message || "Unable to complete plan upgrade.");
      } finally {
        setPaymentLoadingPlan("");
      }
    };

    const handleTransfer = async () => {
      const amount = Number(transferState.amount);
      if (!transferState.fromId || !transferState.toId || transferState.fromId === transferState.toId) {
        setTransferState(prev => ({ ...prev, error: "Pick two different accounts for transfer.", success: "" }));
        return;
      }
      if (!amount || amount <= 0) {
        setTransferState(prev => ({ ...prev, error: "Enter a valid transfer amount.", success: "" }));
        return;
      }
      const source = accounts.find(acc => acc.id === transferState.fromId);
      const destination = accounts.find(acc => acc.id === transferState.toId);
      if (!source || !destination) {
        setTransferState(prev => ({ ...prev, error: "Select valid accounts.", success: "" }));
        return;
      }
      if (source.balance < amount) {
        setTransferState(prev => ({ ...prev, error: "Insufficient funds in the source account.", success: "" }));
        return;
      }
      const localTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: "transfer",
        fromId: source.id,
        toId: destination.id,
        amount,
        description: `Transfer to ${destination.name}`
      };
      try {
        const result = await apiRequest("/api/transfers", {
          method: "POST",
          body: JSON.stringify({ fromId: source.id, toId: destination.id, amount })
        });
        setAccounts(result.accounts);
        setTransactions(result.transactions);
        setStatusMessage("");
      } catch (error) {
        setStatusMessage(`Backend unavailable, transfer saved locally only. ${error.message}`);
        setAccounts(items => items.map(account => {
          if (account.id === source.id) return { ...account, balance: account.balance - amount };
          if (account.id === destination.id) return { ...account, balance: account.balance + amount };
          return account;
        }));
        setTransactions(items => [localTransaction, ...items]);
      }
      setTransferState(prev => ({ ...prev, error: "", success: `Transferred ${formatCurrency(amount)} from ${source.name} to ${destination.name}.`, amount: "" }));
    };

    const handleExportPDF = async () => {
      if (!exportRef.current) return;
      try {
        const canvas = await html2canvas(exportRef.current, { backgroundColor: "#071520", scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`FinCoach-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      } catch (error) {
        console.error(error);
      }
    };

    useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
      if (authState === "login") return undefined;

      let active = true;
      apiRequest("/api/finance")
        .then(data => {
          if (!active) return;
          setProfile(data.profile || defaultProfile);
          setPlan(data.plan || "free");
          setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
          setGoalsData(Array.isArray(data.goals) ? data.goals : []);
          setBillsData(Array.isArray(data.bills) ? data.bills : []);
          setSubscriptions(Array.isArray(data.subscriptions) ? data.subscriptions : []);
          setCashPayments(Array.isArray(data.cashPayments) ? data.cashPayments : []);
          setStatusMessage("");
        })
        .catch(error => {
          if (!active) return;
          if (error.status === 401) {
            resetSession("Please log in to continue.");
            return;
          }
          setStatusMessage(`Unable to load your data. ${error.message}`);
        });
      return () => {
        active = false;
      };
    }, [authState]);

    if (authState === "login") return <LoginPage onLogin={result => {
      if (result?.profile) setProfile(result.profile);
      const completed = Boolean(result?.onboardingCompleted);
      setAuthState(completed ? "app" : "onboarding");
    }} />;
    if (authState === "onboarding") return <SurveyOnboardingPage initialProfile={profile} onDone={handleCompleteOnboarding} />;

    const dashboardProps = {
      profile,
      onSaveProfile: handleSaveProfile,
      setPage,
      plan,
      onChangePlan: handleChangePlan,
      paymentLoadingPlan,
      accounts,
      totalBalance,
      transactions,
      setTransactions,
      filteredTransactions,
      onAddTransaction: handleAddTransaction,
      onDeleteTransaction: handleDeleteTransaction,
      goalsData,
      onAddGoal: handleAddGoal,
      onFundGoal: handleFundGoal,
      onDeleteGoal: handleDeleteGoal,
      billsData,
      onAddBill: handleAddBill,
      onPayBill: handlePayBill,
      onDeleteBill: handleDeleteBill,
      subscriptions,
      cashPayments,
      onAddCashPayment: handleAddCashPayment,
      accountModal,
      setAccountModal,
      onEditAccount: account => setAccountModal({ open: true, account }),
      onDeleteAccount: handleDeleteAccount,
      onSaveAccount: handleSaveAccount,
      transferState,
      setTransferState,
      onTransfer: handleTransfer,
      pdfFilter,
      setPdfFilter,
      exportRef,
      onExportPDF: handleExportPDF,
      statusMessage
    };

    const pageMap = {
      dashboard: DashboardLive,
      accounts: AccountsPage,
      transactions: TransactionsPage,
      analytics: AnalyticsPage,
      ai: AICoach,
      goals: props => <GoalsManagerPage goals={props.goalsData} onAddGoal={props.onAddGoal} onFundGoal={props.onFundGoal} onDeleteGoal={props.onDeleteGoal} />,
      bills: props => <BillsPage bills={props.billsData} onAddBill={props.onAddBill} onPayBill={props.onPayBill} onDeleteBill={props.onDeleteBill} />,
      networth: NetWorthPage,
      budgetplanner: BudgetPlannerPage,
      emicalculator: EMICalculatorPage,
      investadvisor: props => <SimpleFeaturePages type="investadvisor" {...props} />,
      subscriptions: props => <SimpleFeaturePages type="subscriptions" {...props} />,
      cashpayments: CashPaymentsPage,
      smartinsights: props => <SmartInsightsPage transactions={props.transactions} bills={props.billsData} goals={props.goalsData} />,
      aicopilot: props => <SimpleFeaturePages type="aicopilot" {...props} />,
      financialai: props => <SimpleFeaturePages type="financialai" {...props} />,
      premiumfeatures: props => <SimpleFeaturePages type="premium" {...props} />,
      upgradeplan: props => <SimpleFeaturePages type="upgrade" {...props} />,
      calculator: Calculator,
      community: Community,
      videos: Videos,
      testimonials: Testimonials,
      more: MorePage,
      profile: ProfilePage
    };
    const PageComponent = pageMap[page] || Dashboard;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #060B1E 0%, #0D1B3E 50%, #071520 100%)", fontFamily: "system-ui" }}>
        <FloatingBg />
        {isMobile ? (
          <>
            <div style={{ padding: "20px 16px", paddingBottom: "80px", position: "relative", zIndex: 1, maxWidth: "480px", margin: "0 auto" }}>
              <PageComponent {...dashboardProps} />
            </div>
            <BottomNav page={page} setPage={setPage} />
          </>
        ) : (
          <>
            <SideNav page={page} setPage={setPage} profile={profile} onLogout={() => { localStorage.removeItem("fincoach_token"); setAuthState("login"); setPage("dashboard"); }} />
            <div style={{ marginLeft: "260px", padding: "32px", position: "relative", zIndex: 1, width: "calc(100% - 260px)", maxWidth: "none", boxSizing: "border-box" }}>
              <PageComponent {...dashboardProps} />
            </div>
          </>
        )}
      </div>
    );
  }
