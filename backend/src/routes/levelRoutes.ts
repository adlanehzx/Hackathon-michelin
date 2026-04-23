import { Router } from "express";
import { getAllLevels } from "../controllers/levelController";

const router = Router();

router.get("/", getAllLevels);

export default router;
