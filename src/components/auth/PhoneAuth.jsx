import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const isPhoneAuthTestMode = import.meta.env.VITE_FIREBASE_PHONE_AUTH_TEST_MODE === "true";
const isDevBypassEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_AUTH_BYPASS !== "false";

const formatFirebasePhone = phone => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length !== 10) {
    throw new Error("Please enter a valid 10-digit phone number.");
  }
  return `+91${digits}`;
};

const getFirebaseErrorMessage = error => {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-phone-number":
      return "That phone number format is invalid. Enter a 10-digit mobile number.";
    case "auth/missing-phone-number":
      return "Enter your phone number before requesting an OTP.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Complete it again and retry.";
    case "auth/quota-exceeded":
      return "SMS quota is exhausted for this Firebase project. Try again later or use a test number in Firebase Console.";
    case "auth/too-many-requests":
      return "Too many OTP attempts were made for this number or device. Wait a while and try again.";
    case "auth/operation-not-allowed":
      return "Phone sign-in is not enabled in Firebase Console for this project.";
    case "auth/app-not-authorized":
      return "This domain is not authorized in Firebase Authentication. Add your current dev domain in Firebase Console.";
    case "auth/invalid-app-credential":
      return "Firebase rejected the app verification request. Reopen the page and try again.";
    case "auth/network-request-failed":
      return "reCAPTCHA could not reach Firebase or Google services. Check your internet, disable ad blockers/VPN, and allow google.com/gstatic.com.";
    case "auth/billing-not-enabled":
      return "Firebase billing is not enabled for phone authentication. Attach a billing account for live SMS, or use Firebase test phone numbers in dev mode.";
    default:
      return error?.message || "Unable to send OTP right now.";
  }
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
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);
  const recaptchaContainerId = "fincoach-phone-recaptcha";

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const ensureRecaptcha = () => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Firebase phone auth is not configured. Add your VITE_FIREBASE_* values to Fin-w/.env.");
    }

    if (isPhoneAuthTestMode) {
      auth.settings.appVerificationDisabledForTesting = true;
    }

    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: isPhoneAuthTestMode ? "invisible" : "normal",
        callback: () => {
          setError("");
          setMessage("reCAPTCHA verified. You can send the OTP now.");
        },
        "expired-callback": () => {
          setRecaptchaReady(false);
          setMessage("");
          setError("reCAPTCHA expired. Complete it again before requesting OTP.");
        }
      });
    }

    return recaptchaRef.current;
  };

  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
    setRecaptchaReady(false);
  };

  const renderRecaptcha = async () => {
    setRecaptchaLoading(true);
    setError("");

    try {
      const verifier = ensureRecaptcha();
      await verifier.render();
      setRecaptchaReady(true);
    } catch (renderError) {
      console.error("reCAPTCHA render failed:", renderError);
      resetRecaptcha();
      setError(getFirebaseErrorMessage(renderError));
    } finally {
      setRecaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "phone" || !isFirebaseConfigured) {
      return undefined;
    }

    let active = true;
    setRecaptchaLoading(true);

    ensureRecaptcha()
      .render()
      .then(() => {
        if (active) {
          setRecaptchaReady(true);
          setRecaptchaLoading(false);
        }
      })
      .catch(renderError => {
        console.error("reCAPTCHA render failed:", renderError);
        if (active) {
          resetRecaptcha();
          setError(getFirebaseErrorMessage(renderError));
          setRecaptchaLoading(false);
        }
      });

    return () => {
      active = false;
      resetRecaptcha();
    };
  }, [step]);

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
      await appVerifier.render();
      const firebasePhone = formatFirebasePhone(phone);
      confirmationResultRef.current = await signInWithPhoneNumber(auth, firebasePhone, appVerifier);
      setStep("otp");
      setCountdown(30);
      setMessage(`OTP sent to ${firebasePhone}.`);
    } catch (sendError) {
      console.error("Phone OTP send failed:", sendError);
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      setError(getFirebaseErrorMessage(sendError));
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
      console.error("Phone OTP verify failed:", verifyError);
      setError(getFirebaseErrorMessage(verifyError) || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setMessage("");
    confirmationResultRef.current = null;
  };

  const handleResendOtp = () => {
    setStep("phone");
    setOtp("");
    setError("");
    setMessage("Enter your number again to request a fresh OTP.");
    confirmationResultRef.current = null;
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
      setError(bypassError.message || "Unable to open the app in dev bypass mode.");
    } finally {
      setLoading(false);
    }
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
            {error && !recaptchaReady ? (
              <button
                type="button"
                onClick={renderRecaptcha}
                disabled={recaptchaLoading || loading}
                style={{
                  ...buttonStyle,
                  marginBottom: "12px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)"
                }}
              >
                {recaptchaLoading ? "Loading reCAPTCHA..." : "Retry reCAPTCHA"}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading || recaptchaLoading || phone.length !== 10 || !recaptchaReady}
              style={buttonStyle}
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
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)"
                }}
              >
                {loading ? "Opening Dashboard..." : "Enter Dashboard"}
              </button>
            ) : null}
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
                onClick={handleResendOtp}
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
        ) : isPhoneAuthTestMode ? (
          <p style={{ color: "#FDE68A", fontSize: "13px", margin: "16px 0 0" }}>
            Firebase phone auth test mode is enabled. Use a test phone number configured in Firebase Console. No real SMS will be sent.
          </p>
        ) : isDevBypassEnabled ? (
          <p style={{ color: "#FDE68A", fontSize: "13px", margin: "16px 0 0" }}>
            Dev auth bypass is enabled on this local build. Use Enter Dashboard to skip OTP.
          </p>
        ) : step === "phone" && !recaptchaReady ? (
          <p style={{ color: "#FDE68A", fontSize: "13px", margin: "16px 0 0" }}>
            {recaptchaLoading
              ? "Waiting for reCAPTCHA to load. Complete it before requesting OTP."
              : "reCAPTCHA is unavailable right now. Retry it after checking your connection or browser extensions."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
