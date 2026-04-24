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

router.get("/feed/:userId", getPersonalizedFeed);
router.get("/video/:videoId", getVideoById);
router.get("/tags", getAllTags);
router.get("/user/:userId", getUserVideos);

router.post("/create", createVideo);
router.post("/interact", recordInteraction);

router.delete("/:videoId", deleteVideo);

export default router;
