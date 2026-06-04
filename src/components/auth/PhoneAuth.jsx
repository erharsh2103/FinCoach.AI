import { useEffect, useState } from "react";
import { authApi } from "../../api/api.js";

const isDevBypassEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_AUTH_BYPASS !== "false";

const getErrorMessage = error => {
  if (!error) return "Unable to complete authentication right now.";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return "Unable to complete authentication right now.";
};

const createLocalBypassResult = phone => {
  const normalizedPhone = String(phone || "").replace(/\D/g, "").slice(0, 10) || "9999999999";

  return {
    authenticated: true,
    token: `dev-bypass-${Date.now()}`,
    onboardingCompleted: true,
    profile: {
      name: "Dev User",
      phone: normalizedPhone,
      email: "",
      city: "",
      income: "",
      savingsGoal: "",
      onboardingCompleted: true
    }
  };
};

export default function PhoneAuth({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const createAppSession = async phoneNumber => {
    const normalizedPhone = String(phoneNumber || "").replace(/\D/g, "").slice(-10);
    const result = await authApi.createPhoneSession(normalizedPhone);
    localStorage.setItem("fincoach_token", result.token);
    onLogin(result);
  };

  const sendOtpRequest = async () => {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return null;
    }

    const response = await authApi.sendOtp(phone);
    return response;
  };

  const handleSendOtp = async event => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await sendOtpRequest();
      if (!result) return;
      const devOtp = result.devOtp ? ` Dev OTP: ${result.devOtp}` : "";
      setStep("otp");
      setCountdown(30);
      setMessage(`OTP sent to +91${phone}.${devOtp}`);
    } catch (sendError) {
      console.error("OTP send failed:", sendError);
      setError(getErrorMessage(sendError));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async event => {
    event.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await authApi.verifyOtp(phone, otp.trim());
      localStorage.setItem("fincoach_token", result.token);
      onLogin(result);
    } catch (verifyError) {
      console.error("OTP verify failed:", verifyError);
      setError(getErrorMessage(verifyError) || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setMessage("");
  };

  const handleResendOtp = async () => {
    if (loading) return;
    setError("");
    setMessage("");
    setOtp("");

    try {
      const result = await sendOtpRequest();
      if (!result) return;
      const devOtp = result.devOtp ? ` Dev OTP: ${result.devOtp}` : "";
      setCountdown(30);
      setMessage(`OTP resent to +91${phone}.${devOtp}`);
    } catch (resendError) {
      console.error("OTP resend failed:", resendError);
      setError(getErrorMessage(resendError));
    }
  };

  const handleDevBypass = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const fallbackPhone = phone.length === 10 ? phone : "9999999999";
      try {
        await createAppSession(fallbackPhone);
      } catch (sessionError) {
        const localResult = createLocalBypassResult(fallbackPhone);
        localStorage.setItem("fincoach_token", localResult.token);
        onLogin(localResult);
        setMessage("Opened dashboard in local dev bypass mode.");
      }
    } catch (bypassError) {
      setError(getErrorMessage(bypassError));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none"
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, var(--primary), var(--accent))",
    color: "var(--surface)",
    fontSize: "15px",
    fontWeight: 700,
    cursor: loading ? "progress" : "pointer",
    opacity: loading ? 0.7 : 1
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", boxSizing: "border-box", background: "var(--bg)" }}>
      <div
        style={{
          width: "min(460px, 100%)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "28px",
          padding: "36px 32px",
          boxSizing: "border-box",
          boxShadow: "var(--card-shadow)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(82,103,125,0.08), transparent 28%), radial-gradient(circle at bottom right, rgba(28,46,74,0.08), transparent 20%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", borderRadius: "18px", background: "var(--primary)", color: "var(--surface)", fontSize: "22px", margin: "0 auto 18px" }}>
            ✦
          </div>
          <h1 style={{ color: "var(--primary)", fontSize: "30px", fontWeight: 800, margin: "0 0 12px", textAlign: "center" }}>Secure sign in</h1>
          <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.7, textAlign: "center", margin: "0 0 28px" }}>
            Get a one-time code instantly. No visible reCAPTCHA, no extra steps — just a clean, modern login flow.
          </p>

          {step === "phone" ? (
            <form onSubmit={handleSendOtp}>
              <label style={{ display: "block", color: "var(--text)", marginBottom: "10px", fontSize: "14px", fontWeight: 600 }}>
                Mobile number
              </label>
              <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                <div style={{ minWidth: "70px", padding: "14px 12px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", textAlign: "center", fontSize: "16px" }}>
                  +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  placeholder="9876543210"
                  value={phone}
                  onChange={event => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                style={{
                  ...buttonStyle,
                  background: phone.length === 10 ? "linear-gradient(135deg, var(--primary), var(--accent))" : "rgba(82,103,125,0.18)",
                  cursor: phone.length === 10 && !loading ? "pointer" : "not-allowed"
                }}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
              {isDevBypassEnabled ? (
                <button
                  type="button"
                  onClick={handleDevBypass}
                  disabled={loading}
                  style={{
                    ...buttonStyle,
                    marginTop: "12px",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text)"
                  }}
                >
                  {loading ? "Opening Dashboard..." : "Enter Dashboard"}
                </button>
              ) : null}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <label style={{ display: "block", color: "var(--text)", marginBottom: "10px", fontSize: "14px", fontWeight: 600 }}>
                Verification code
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="6-digit OTP"
                value={otp}
                onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ ...inputStyle, marginBottom: "18px", letterSpacing: "0.35em", textAlign: "center" }}
              />
              <button type="submit" disabled={loading || otp.length !== 6} style={{
                ...buttonStyle,
                background: otp.length === 6 ? "linear-gradient(135deg, var(--primary), var(--accent))" : "rgba(82,103,125,0.18)",
                cursor: otp.length === 6 && !loading ? "pointer" : "not-allowed"
              }}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "16px", fontSize: "14px" }}>
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, fontWeight: 600 }}
                >
                  Change number
                </button>
                <button
                  type="button"
                  disabled={loading || countdown > 0}
                  onClick={handleResendOtp}
                  style={{ background: "none", border: "none", color: countdown > 0 ? "rgba(82,103,125,0.45)" : "var(--primary)", cursor: countdown > 0 ? "not-allowed" : "pointer", padding: 0, fontWeight: 600 }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {message ? <p style={{ color: "#166534", fontSize: "14px", margin: "20px 0 0" }}>{message}</p> : null}
          {error ? <p style={{ color: "#B91C1C", fontSize: "14px", margin: "20px 0 0" }}>{error}</p> : null}

          <div style={{ marginTop: "28px", display: "grid", gap: "10px", color: "var(--muted)", fontSize: "13px" }}>
            <span>✅ No reCAPTCHA challenge required</span>
            <span>🔒 Secure session with backend OTP verification</span>
            <span>📲 Local OTPs are logged when SMS provider is not configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}

