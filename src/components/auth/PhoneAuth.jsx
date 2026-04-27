import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const formatFirebasePhone = phone => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length !== 10) {
    throw new Error("Please enter a valid 10-digit phone number.");
  }
  return `+91${digits}`;
};

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
};

export default function PhoneAuth({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);
  const recaptchaContainerId = "fincoach-phone-recaptcha";

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  const ensureRecaptcha = () => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Firebase phone auth is not configured. Add your VITE_FIREBASE_* values to Fin-w/.env.");
    }

    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: "normal",
        callback: () => {
          setError("");
        }
      });
    }

    return recaptchaRef.current;
  };

  const createAppSession = async verifiedPhone => {
    const normalizedPhone = String(verifiedPhone || "").replace(/\D/g, "").slice(-10);
    const result = await apiRequest("/api/auth/phone-session", {
      method: "POST",
      body: JSON.stringify({ phone: normalizedPhone })
    });
    localStorage.setItem("fincoach_token", result.token);
    onLogin(result);
  };

  const handleSendOtp = async event => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const appVerifier = ensureRecaptcha();
      const firebasePhone = formatFirebasePhone(phone);
      confirmationResultRef.current = await signInWithPhoneNumber(auth, firebasePhone, appVerifier);
      setStep("otp");
      setCountdown(30);
      setMessage(`OTP sent to ${firebasePhone}.`);
    } catch (sendError) {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      setError(sendError.message || "Unable to send OTP right now.");
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

    if (!confirmationResultRef.current) {
      setError("Request a fresh OTP and try again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const credential = await confirmationResultRef.current.confirm(otp.trim());
      await createAppSession(credential.user.phoneNumber);
    } catch (verifyError) {
      setError(verifyError.message || "OTP verification failed.");
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

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none"
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #2563EB, #059669)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: loading ? "progress" : "pointer",
    opacity: loading ? 0.7 : 1
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #060B1E 0%, #0D1B3E 50%, #071520 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "min(420px, 100%)",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          backdropFilter: "blur(16px)",
          padding: "32px",
          boxSizing: "border-box",
          boxShadow: "0 20px 70px rgba(0,0,0,0.35)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #2563EB, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "28px",
              margin: "0 auto 16px"
            }}
          >
            OTP
          </div>
          <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 8px" }}>Sign in to FinCoach</h1>
          <p style={{ color: "rgba(255,255,255,0.68)", margin: 0, fontSize: "15px" }}>
            Verify your phone number with Firebase OTP.
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.76)", marginBottom: "8px", fontSize: "14px" }}>
              Phone number
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  minWidth: "68px",
                  padding: "14px 12px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  textAlign: "center",
                  fontSize: "16px"
                }}
              >
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
            <div id={recaptchaContainerId} style={{ marginBottom: "16px" }} />
            <button type="submit" disabled={loading || phone.length !== 10} style={buttonStyle}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label style={{ display: "block", color: "rgba(255,255,255,0.76)", marginBottom: "8px", fontSize: "14px" }}>
              Enter OTP
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="6-digit code"
              value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ ...inputStyle, marginBottom: "16px", letterSpacing: "0.2em", textAlign: "center" }}
            />
            <button type="submit" disabled={loading || otp.length !== 6} style={buttonStyle}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "14px" }}>
              <button
                type="button"
                onClick={handleChangeNumber}
                style={{ background: "none", border: "none", color: "#93C5FD", cursor: "pointer", padding: 0 }}
              >
                Change number
              </button>
              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleChangeNumber}
                style={{
                  background: "none",
                  border: "none",
                  color: countdown > 0 ? "rgba(255,255,255,0.35)" : "#86EFAC",
                  cursor: countdown > 0 ? "default" : "pointer",
                  padding: 0
                }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {message ? <p style={{ color: "#86EFAC", fontSize: "14px", margin: "16px 0 0" }}>{message}</p> : null}
        {error ? <p style={{ color: "#FCA5A5", fontSize: "14px", margin: "16px 0 0" }}>{error}</p> : null}

        {!isFirebaseConfigured ? (
          <p style={{ color: "#FDE68A", fontSize: "13px", margin: "16px 0 0" }}>
            Missing Firebase config. Set the `VITE_FIREBASE_*` variables in `Fin-w/.env`.
          </p>
        ) : null}
      </div>
    </div>
  );
}
