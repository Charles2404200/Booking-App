import mongoose from 'mongoose';
const { Schema } = mongoose;

const HotelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  distance: {
    type: Number,
  },
  photos: {
    type: [String],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  rooms: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }], 
    required: true,
  },
  facilities: {
    type: [String],
    required: true,
  },
  reviewsCount: {
    type: Number,
    default: 0,
  },
  cheapestPrice: {
    type: Number,
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model('Hotel', HotelSchema);