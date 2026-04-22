import express from "express";
import {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantsByLocation,
} from "../controllers/restaurantController";

const router = express.Router();

router.get("/", getAllRestaurants);
router.get("/location", getRestaurantsByLocation);
router.get("/:id", getRestaurantById);

export default router;
