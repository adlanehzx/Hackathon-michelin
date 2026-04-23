import { Router } from "express";
import {
  getAllBadges,
  getMyBadges,
  getUserBadges,
} from "../controllers/badgeController";
import authMiddleware from "../middleware/auth";

const router = Router();

router.get("/", getAllBadges);
router.get("/me", authMiddleware, getMyBadges);

export default router;

export const userBadgesRouter = Router();
userBadgesRouter.get("/:id/badges", getUserBadges);
