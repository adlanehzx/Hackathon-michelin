import express from "express";
import {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantsByLocation,
  searchRestaurants,
} from "../controllers/restaurantController";

const router = express.Router();

router.get("/", getAllRestaurants);
router.get("/search", searchRestaurants);
router.get("/location", getRestaurantsByLocation);
router.get("/:id", getRestaurantById);

export default router;
