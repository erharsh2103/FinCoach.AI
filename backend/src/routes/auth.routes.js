import { Router } from "express";
import { sendOtp, validatePhone, verifyOtpAndLogin } from "../controllers/auth.controller.js";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndLogin);
router.post("/validate-phone", validatePhone);

export default router;
