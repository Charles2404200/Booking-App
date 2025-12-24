import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import { createError } from "../utils/error.js";
export const createHotel = async (req, res, next) => {
  const newHotel = new Hotel(req.body);
  try {
    const savedHotel = await newHotel.save();
    res.status(200).json(savedHotel);
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (req, res, next) => {
  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.status(200).json(updatedHotel);
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (req, res, next) => {
  try {
    const deletedHotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!deletedHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.status(200).json({ message: 'Hotel deleted successfully', deletedHotel });
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).populate('rooms'); 
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.status(200).json(hotel);
  } catch (error) {
    next(error);
  }
};

export const getAllHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels.populate(room));
  } catch (error) {
    next(error);
  }
};

export const searchHotels = async (req, res, next) => {
  const { location, startDate, endDate, adults, rooms } = req.body;

  try {
    // Convert startDate and endDate to Date objects
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(new Date().setDate(new Date().getDate() + 1));

    let hotels = [];

    if (!location) {
      // If location is null, return all hotels
      hotels = await Hotel.find();
    } else {
      // First, try finding hotels by city
      hotels = await Hotel.find({ city: location });
    
      // If no hotels are found by city, try finding by hotel name
      if (!hotels.length) {
        hotels = await Hotel.find({ name: location });
      }
    
      // If still no hotels found, try finding by _id
      if (!hotels.length) {
        try {
          hotels = await Hotel.find({ _id: location });
        } catch (error) {
          return next(createError(404, 'No hotels found in the specified location.'));
        }
      }
    
      // If still no hotels, return 404
      if (!hotels.length) {
        return next(createError(404, 'No hotels found in the specified location.'));
      }
    }

    let availableHotels = [];

    for (let hotel of hotels) {
      const hotelRooms = await Room.find({ _id: { $in: hotel.rooms } });
      let availableRooms = [];

      for (let room of hotelRooms) {
        const availableRoomNumbers = room.roomNumbers.filter(roomNumber =>
          isRoomAvailable(roomNumber, start, end) &&
          room.maxPeople >= parseInt(adults)
        );

        if (availableRoomNumbers.length > 0) {
          availableRooms.push({
            roomId: room._id,
            title: room.title,
            price: room.price,
            maxPeople: room.maxPeople,
            desc: room.desc,
            availableRooms: availableRoomNumbers.length,
            roomNumbers: availableRoomNumbers
          });
        }
      }

      if (availableRooms.length >= parseInt(rooms)) {
        availableHotels.push({
          hotelId: hotel._id,
          hotelName: hotel.name,
          address: hotel.address,
          photos: hotel.photos,
          cheapestPrice: hotel.cheapestPrice,
          facilities: hotel.facilities,
          city: hotel.city,
          rating: hotel.rating,
          distance: hotel.distance,
          rooms: availableRooms
        });
      }
    }

    if (!availableHotels.length) {
      return res.status(200).json({ message: 'No available hotels found for the given criteria.' });
    }

    res.status(200).json(availableHotels);
  } catch (err) {
    console.error('Error:', err);
    next(err);
  }
};

// Helper function to check if the room is available
const isRoomAvailable = (roomNumber, startDate, endDate) => {
  for (let i = 0; i < roomNumber.unavailableDates.length; i += 2) {
    const unavailableStart = new Date(roomNumber.unavailableDates[i]);
    const unavailableEnd = new Date(roomNumber.unavailableDates[i + 1]);

    if (!(endDate < unavailableStart || startDate > unavailableEnd)) {
      return false; // Room is not available
    }
  }
  return true; // Room is available
};
