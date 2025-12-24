// routes/hotels.js
import express from 'express';
import { createHotel, updateHotel, deleteHotel, getHotelById, getAllHotels,searchHotels} from '../controllers/hotel.js';
import { verifyAdmin } from '../utils/verifyToken.js';
const router = express.Router();

// Create
router.post('/',verifyAdmin, createHotel);

// Update
router.put('/:id',verifyAdmin, updateHotel);

// Delete
router.delete('/:id', verifyAdmin, deleteHotel);

// Get with Id
router.get('/:hotelId', getHotelById);

// Get All
router.get('/', getAllHotels);
//Search

router.post('/search',searchHotels);
export default router;