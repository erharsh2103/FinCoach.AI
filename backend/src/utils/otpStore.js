import crypto from "node:crypto";

const otpStore = new Map();

export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(0, 10);
}

export function createOtp(phone) {
  const normalizedPhone = normalizePhone(phone);
  const existing = otpStore.get(normalizedPhone);

  if (existing && Date.now() - existing.createdAt < 30_000) {
    throw new Error("Please wait before requesting another OTP.");
  }

  const otp = String(crypto.randomInt(100000, 999999));

  otpStore.set(normalizedPhone, {
    otp,
    attempts: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  return {
    phone: normalizedPhone,
    otp
  };
}

export function verifyOtp(phone, otp) {
  const normalizedPhone = normalizePhone(phone);
  const entry = otpStore.get(normalizedPhone);

  if (!entry) {
    throw new Error("OTP not found. Please request a new OTP.");
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedPhone);
    throw new Error("OTP expired. Please request a new OTP.");
  }

  if (entry.attempts >= 5) {
    otpStore.delete(normalizedPhone);
    throw new Error("Too many incorrect attempts. Please request a new OTP.");
  }

  if (String(otp || "") !== entry.otp) {
    entry.attempts += 1;
    throw new Error("Incorrect OTP. Please try again.");
  }

  otpStore.delete(normalizedPhone);
  return normalizedPhone;
}
