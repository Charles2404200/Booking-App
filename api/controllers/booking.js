import Booking from "../models/Booking.js";
import Room from "../models/Room.js";

// GET - Fetch all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET - Fetch single booking by ID
export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Create a new booking
export const createBooking = async (req, res) => {
  const { userId, hotelId, roomId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
  try {
  

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const bookingStartDate = new Date(checkInDate);
    const bookingEndDate = new Date(checkOutDate);
    let roomNumberId = null;

    const availableRoomNumber = room.roomNumbers.find((roomNumber) => {
      if (isRoomNumberAvailable(roomNumber, bookingStartDate, bookingEndDate)) {
        roomNumberId = roomNumber.number;
        return true;
      }
      return false;
    });

    if (availableRoomNumber) {
      console.log("Save booking");
      availableRoomNumber.unavailableDates.push(bookingStartDate, bookingEndDate);
      await room.save();
      const booking = await Booking.create({
        user: userId,
        hotel: hotelId,
        room: roomId,
        checkInDate,
        checkOutDate,
        guests,
        totalPrice,
      });
      booking.roomNumber = roomNumberId;
      
      await booking.save();
    
      const populatedBooking = await Booking.findById(booking._id)
        .populate({
          path: 'room',
          populate: {
            path: 'roomNumbers',
          },
        });
    
      return res.status(201).json(populatedBooking);  // Return 201 on success
    }
    
    // If no room is available, return 401
    return res.status(401).json({ message: 'No available room for the specified date range.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT - Update a booking by ID
export const updateBookingById = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE - Delete a booking by ID
export const deleteBookingById = async (req, res) => {
  const { id: bookingId } = req.params;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const room = await Room.findById(booking.room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const roomNumber = room.roomNumbers.find(roomnumber => roomnumber.number === booking.roomNumber);
    if (!roomNumber) {
      return res.status(404).json({ message: "Room number not found" });
    }

    const bookingStartDate = new Date(booking.checkInDate);
    const bookingEndDate = new Date(booking.checkOutDate);
    roomNumber.unavailableDates = roomNumber.unavailableDates.filter(date => {
      const dateObj = new Date(date);
      return !(dateObj >= bookingStartDate && dateObj <= bookingEndDate);
    });

    await room.save();
    await booking.delete();

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET - Fetch bookings by user ID
export const getBookingsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Booking.find({ user: userId })
      .populate("hotel")
      .populate("room");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check room number availability for given date range and capacity
const isRoomNumberAvailable = (roomNumber, startDate, endDate) => {
  for (let i = 0; i < roomNumber.unavailableDates.length; i += 2) {
    const unavailableStart = new Date(roomNumber.unavailableDates[i]);
    const unavailableEnd = new Date(roomNumber.unavailableDates[i + 1]);

    if (!(endDate < unavailableStart || startDate > unavailableEnd)) {
      return false;
    }
  }
  return true;
};

export const getBookingByRoomId = async (req, res, next) => {
  const { roomId } = req.params;
  try {
    const bookings = await Booking.find({ room: roomId })
      .populate('user') // Populate the user field
      .populate('hotel') // Populate the hotel field if needed
      .populate('room'); // Populate the room field if needed
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};