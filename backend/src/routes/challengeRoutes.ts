import { Router } from "express";
import {
  getAllChallenges,
  getChallengeById,
  getMyChallenges,
  completeChallenge,
} from "../controllers/challengeController";
import authMiddleware from "../middleware/auth";

const router = Router();

router.get("/", getAllChallenges);
router.get("/me", authMiddleware, getMyChallenges);
router.get("/:id", getChallengeById);
router.post("/:id/complete", authMiddleware, completeChallenge);

export default router;
