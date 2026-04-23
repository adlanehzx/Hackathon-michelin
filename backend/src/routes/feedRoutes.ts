import { Router } from "express";
import {
  getPersonalizedFeed,
  getVideoById,
  createVideo,
  recordInteraction,
  getAllTags,
  getUserVideos,
  deleteVideo,
} from "../controllers/feedController";

const router = Router();

// GET endpoints
router.get("/feed/:userId", getPersonalizedFeed);
router.get("/video/:videoId", getVideoById);
router.get("/tags", getAllTags);
router.get("/user/:userId", getUserVideos);

// POST endpoints
router.post("/create", createVideo);
router.post("/interact", recordInteraction);

// DELETE endpoints
router.delete("/:videoId", deleteVideo);

export default router;
