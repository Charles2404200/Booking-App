import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  roomNumber: {
    type: Number,
    
   
  },
  checkInDate: Date,
  checkOutDate: Date,
  guests: {
    adults: {
      type: Number,
      required: true,
    },
    children: {
      type: Number,
      default: 0,
    },
  },
  totalPrice: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Booking', BookingSchema);