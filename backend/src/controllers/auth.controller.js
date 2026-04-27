import { asyncHandler } from "../utils/asyncHandler.js";
import { createOtp, normalizePhone, verifyOtp } from "../utils/otpStore.js";
import { createSessionForPhone } from "../services/workspace.service.js";
import env from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const normalizedPhone = normalizePhone(phone);

  if (!/^\d{10}$/.test(normalizedPhone)) {
    throw new HttpError(400, "Phone number must be exactly 10 digits.");
  }

  const result = createOtp(normalizedPhone);
  console.log(`OTP for ${normalizedPhone}: ${result.otp}`);

  res.status(200).json({
    sent: true,
    phone: normalizedPhone,
    expiresInSeconds: 300,
    devOtp: env.smsProvider ? undefined : result.otp
  });
});

export const verifyOtpAndLogin = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  const normalizedPhone = verifyOtp(phone, otp);
  const workspace = await createSessionForPhone(normalizedPhone);

  res.status(200).json({
    verified: true,
    token: workspace.session.token,
    profile: workspace.profile,
    onboardingCompleted: Boolean(workspace.onboardingCompleted)
  });
});

export const validatePhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const normalizedPhone = normalizePhone(phone);
  const valid = /^\d{10}$/.test(normalizedPhone);

  if (!valid) {
    throw new HttpError(400, "Phone number must be exactly 10 digits.");
  }

  res.status(200).json({ valid: true, phone: normalizedPhone });
});

export const createPhoneSession = asyncHandler(async (req, res) => {
  const normalizedPhone = normalizePhone(req.body?.phone);

  if (!/^\d{10}$/.test(normalizedPhone)) {
    throw new HttpError(400, "Phone number must be exactly 10 digits.");
  }

  const workspace = await createSessionForPhone(normalizedPhone);

  res.status(200).json({
    authenticated: true,
    token: workspace.session.token,
    profile: workspace.profile,
    onboardingCompleted: Boolean(workspace.onboardingCompleted)
  });
});
