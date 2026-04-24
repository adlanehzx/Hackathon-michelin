import express from "express";
import {
  getAllHotels,
  getHotelById,
  getHotelsByLocation,
  searchHotels,
} from "../controllers/hotelController";

const router = express.Router();

router.get("/", getAllHotels);
router.get("/search", searchHotels);
router.get("/location", getHotelsByLocation);
router.get("/:id", getHotelById);

export default router;
