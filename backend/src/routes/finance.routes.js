import { Router } from "express";
import {
  createAccount,
  createBill,
  createCashPayment,
  createGoal,
  createTransaction,
  createTransfer,
  deleteAccount,
  deleteBill,
  deleteGoal,
  deleteTransaction,
  fundGoal,
  getFinance,
  getHealth,
  payBill,
  updateAccount,
  updatePlan,
  updateProfile
} from "../controllers/finance.controller.js";

const router = Router();

router.get("/health", getHealth);
router.get("/finance", getFinance);
router.put("/profile", updateProfile);
router.put("/plan", updatePlan);
router.post("/transactions", createTransaction);
router.delete("/transactions/:id", deleteTransaction);
router.post("/goals", createGoal);
router.put("/goals/:id/fund", fundGoal);
router.delete("/goals/:id", deleteGoal);
router.post("/bills", createBill);
router.put("/bills/:id/pay", payBill);
router.delete("/bills/:id", deleteBill);
router.post("/cash-payments", createCashPayment);
router.post("/accounts", createAccount);
router.put("/accounts/:id", updateAccount);
router.delete("/accounts/:id", deleteAccount);
router.post("/transfers", createTransfer);

export default router;
