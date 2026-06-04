import { Router } from "express";
import authRoutes from "./auth.routes.js";
import financeRoutes from "./finance.routes.js";
import paymentRoutes from "./payment.routes.js";
import coachRoutes from "./coach.routes.js";

const router = Router();

router.use("/api", financeRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/payments", paymentRoutes);
router.use("/api/coach", coachRoutes);

export default router;
