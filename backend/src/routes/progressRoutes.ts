import { Router } from "express";
import { getMyProgress, getUserProgress } from "../controllers/progressController";
import authMiddleware from "../middleware/auth";

const router = Router();

router.get("/me", authMiddleware, getMyProgress);

export default router;

export const userProgressRouter = Router();
userProgressRouter.get("/:id/progress", getUserProgress);
