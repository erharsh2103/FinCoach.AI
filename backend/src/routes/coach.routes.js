import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { coachChat } from "../controllers/coach.controller.js";

const router = Router();

router.post("/chat", requireAuth, coachChat);

export default router;
