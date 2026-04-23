import { Router } from "express";
import {
  completeParcoursStop,
  createParcours,
  getParcoursFilterOptions,
  getUserParcours,
  suggestParcours,
} from "../controllers/parcoursController";

const router = Router();

router.get("/filters/options", getParcoursFilterOptions);
router.get("/user/:userId", getUserParcours);
router.post("/suggestions", suggestParcours);
router.post("/", createParcours);
router.patch("/:parcoursId/items/:restaurantId/complete", completeParcoursStop);

export default router;