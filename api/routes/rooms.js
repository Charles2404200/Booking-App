import express from "express";
import {
  createRoom,
  deleteRoom,
  getRoom,
  getAllRooms,
  updateRoom,
  updateRoomAvailability,
  searchRooms,getRoomsByHotel
} from "../controllers/room.js";
import { verifyAdmin } from "../utils/verifyToken.js";

const router = express.Router();
//CREATE
router.post("/:hotelId",  createRoom);

//UPDATE
router.put("/availability/:id", updateRoomAvailability);
router.put("/:id", verifyAdmin, updateRoom);
//DELETE
router.delete("/:id/:hotelid", verifyAdmin, deleteRoom);
//GET

//GET ALL

router.get("/", getAllRooms);
router.get('/search', searchRooms);
router.get("/hotel/:hotelId", getRoomsByHotel);

export default router;