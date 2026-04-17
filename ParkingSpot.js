const mongoose = require('mongoose');

const ParkingSpotSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  description: {
    type: String,
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalSlots: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  availableSlots: {
    type: Number,
    min: 0,
    default: 1,
  },
  timeLimit: {
    type: String,
    trim: true,
    default: 'Flexible',
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);
