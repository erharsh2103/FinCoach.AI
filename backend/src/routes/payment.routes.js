import { Router } from "express";
import {
  createPaymentOrder,
  getPaymentHistory,
  verifyPayment
} from "../controllers/payment.controller.js";

const router = Router();

router.get("/history", getPaymentHistory);
router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);

export default router;
