import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import { createError } from "../utils/error.js";

export const createRoom = async (req, res, next) => {
  const hotelId = req.params.hotelId;  // Get hotelId from the URL params

  const newRoom = new Room(req.body);  // Create a new Room document from request body

  try {
    // Save the new room to the database
    const savedRoom = await newRoom.save();

    // Find the hotel by its ID and push the room's ObjectId to its 'rooms' array
    await Hotel.findByIdAndUpdate(hotelId, {
      $push: { rooms: savedRoom._id }
    });

    res.status(200).json(savedRoom);  // Return the newly created room
  } catch (err) {
    next(err);  // Pass any errors to the error handling middleware
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedRoom);
  } catch (err) {
    next(err);
  }
};

export const updateRoomAvailability = async (req, res, next) => {
  try {
    await Room.updateOne(
      { "roomNumbers._id": req.params.id },
      {
        $push: {
          "roomNumbers.$.unavailableDates": req.body.dates
        },
      }
    );
    const updatedRoom = await Room.findOne({ "roomNumbers._id": req.params.id });
    res.status(200).json("Room status has been updated.");
  } catch (err) {
    next(err);
  }
};

export const deleteRoom = async (req, res, next) => {
  const hotelId = req.params.hotelid;
  try {
    await Room.findByIdAndDelete(req.params.id);
    try {
      await Hotel.findByIdAndUpdate(hotelId, {
        $pull: { rooms: req.params.id },
      });
    } catch (err) {
      next(err);
    }
    res.status(200).json("Room has been deleted.");
  } catch (err) {
    next(err);
  }
};

export const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
};

export const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (err) {
    next(err);
  }
};
export const searchRooms = async (req, res, next) => {
  const { location, startDate, endDate, adults, children, rooms } = req.body;
  
  try {
    // Convert startDate and endDate to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if the search term is a hotel name
    const hotel = await Hotel.findOne({ name: location });

    // If hotel is found by name, search for rooms in that hotel
    if (hotel) {
      const hotelRooms = await Room.find({ _id: { $in: hotel.rooms } });

      // Array to store available rooms for this hotel
      let availableRooms = [];

      // Check availability for each room in the hotel
      for (let room of hotelRooms) {
        const availableRoomNumbers = room.roomNumbers.filter(roomNumber =>
          isRoomNumberAvailable(roomNumber, start, end) &&
          room.maxPeople >= parseInt(adults) + parseInt(children)
        );

        if (availableRoomNumbers.length > 0) {
          availableRooms.push({
            hotelId: hotel._id,
            roomId: room._id,
            title: room.title,
            price: room.price,
            maxPeople: room.maxPeople,
            desc: room.desc,
            availableRooms: availableRoomNumbers.length,
          });
        }
      }

      return res.status(200).json({ hotel: hotel.name, rooms: availableRooms });
    }

    // If no hotel by that name is found, treat it as a city search
    const hotels = await Hotel.find({ city: location });

    // Array to store available rooms across all hotels in the city
    let availableRooms = [];
    let hotelTotalAvailableRooms = [];

    for (let hotel of hotels) {
      const hotelRooms = await Room.find({ _id: { $in: hotel.rooms } });

      let hotelAvailableRooms = [];

      for (let room of hotelRooms) {
        const availableRoomNumbers = room.roomNumbers.filter(roomNumber =>
          isRoomNumberAvailable(roomNumber, start, end) &&
          room.maxPeople >= parseInt(adults) + parseInt(children)
        );

        if (availableRoomNumbers.length > 0) {
          hotelAvailableRooms.push({
            hotelId: hotel._id,
            roomId: room._id,
            title: room.title,
            price: room.price,
            maxPeople: room.maxPeople,
            desc: room.desc,
            availableRooms: availableRoomNumbers.length,
          });
        }
      }

      const totalAvailableRooms = hotelAvailableRooms.reduce((acc, room) => acc + room.availableRooms, 0);

      hotelTotalAvailableRooms.push({
        hotelId: hotel._id,
        total: totalAvailableRooms
      });

      availableRooms = [...availableRooms, ...hotelAvailableRooms];
    }

    res.status(200).json(availableRooms);
  } catch (err) {
    next(err);
  }
};

// Helper function to check room number availability for given date range and capacity
const isRoomNumberAvailable = (roomNumber, startDate, endDate) => {
  for (let i = 0; i < roomNumber.unavailableDates.length; i += 2) {
    const unavailableStart = new Date(roomNumber.unavailableDates[i]);
    const unavailableEnd = new Date(roomNumber.unavailableDates[i + 1]);

    // Check for overlap between requested date range and unavailable dates
    if (!(endDate < unavailableStart || startDate > unavailableEnd)) {
      return false; // Overlap found, room number is not available
    }
  }
  return true; // No overlap found, room number is available
};

export const getRoomsByHotel = async (req, res, next) => {
  const { hotelId } = req.params;

  try {
    // Find the hotel by ID
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Fetch the rooms for the hotel
    const rooms = await Room.find({ _id: { $in: hotel.rooms } });

    // Send the rooms in the response
    res.status(200).json(rooms);
  } catch (error) {
    // Handle errors
    next(error); // Use next to pass the error to the error handling middleware
  }
};