import { Router } from "express";
import { createPhoneSession, sendOtp, validatePhone, verifyOtpAndLogin, devLogin } from "../controllers/auth.controller.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndLogin);
router.post("/validate-phone", validatePhone);
router.post("/phone-session", createPhoneSession);
router.post("/dev-login", devLogin);

export default router;
