import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
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

router.get("/health", optionalAuth, getHealth);
router.get("/finance", requireAuth, getFinance);
router.put("/profile", requireAuth, updateProfile);
router.put("/plan", requireAuth, updatePlan);
router.post("/transactions", requireAuth, createTransaction);
router.delete("/transactions/:id", requireAuth, deleteTransaction);
router.post("/goals", requireAuth, createGoal);
router.put("/goals/:id/fund", requireAuth, fundGoal);
router.delete("/goals/:id", requireAuth, deleteGoal);
router.post("/bills", requireAuth, createBill);
router.put("/bills/:id/pay", requireAuth, payBill);
router.delete("/bills/:id", requireAuth, deleteBill);
router.post("/cash-payments", requireAuth, createCashPayment);
router.post("/accounts", requireAuth, createAccount);
router.put("/accounts/:id", requireAuth, updateAccount);
router.delete("/accounts/:id", requireAuth, deleteAccount);
router.post("/transfers", requireAuth, createTransfer);

export default router;
