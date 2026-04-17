const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    parkingSpotId: {
      type: String,
      required: true
    },

    parkingSpotDescription: {
      type: String,
      required: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true
    },

    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      required: true
    },

    totalPrice: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked"
    },

    source: {
      type: String,
      enum: ["mock", "database"],
      default: "database"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
