import express from 'express';
import { getAllBookings, getBookingById, getBookingsByUser, createBooking, updateBookingById, deleteBookingById, getBookingByRoomId } from '../controllers/booking.js';
import { verifyAdmin, verifyStatus } from '../utils/verifyToken.js';

const router = express.Router();

// Create a new booking
router.post('/',verifyStatus, createBooking);

// Update a booking by ID
router.put('/:id', verifyAdmin, updateBookingById);

// Delete a booking by ID
router.delete('/:id',verifyStatus, deleteBookingById);

// Get a booking by ID
router.get('/:id', getBookingById);

// Get all bookings
router.get('/', getAllBookings);

// Get bookings by user ID
router.get('/user/:userId', getBookingsByUser);

router.get('/room/:roomId', getBookingByRoomId);

export default router;