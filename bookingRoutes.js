const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Spot = require("../models/ParkingSpot");
const mockSpots = require("../data/mockSpots");
const { addBooking, listBookings, updateBooking } = require("../data/mockBookingsStore");

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function sanitizeBooking(booking) {
  if (!booking) {
    return booking;
  }

  const plainBooking = booking.toObject ? booking.toObject() : booking;

  return {
    ...plainBooking,
    id: String(plainBooking._id || plainBooking.id),
  };
}

function overlaps(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

async function getSpotById(spotId) {
  if (isDatabaseReady()) {
    const spot = await Spot.findById(spotId).lean();
    return spot ? { ...spot, id: String(spot._id), source: "database" } : null;
  }

  const spot = mockSpots.find((item) => item.id === spotId);
  return spot ? { ...spot, source: "mock" } : null;
}

async function findConflictingBooking(spotId, startTime, endTime) {
  if (isDatabaseReady()) {
    return Booking.findOne({
      parkingSpotId: spotId,
      status: "booked",
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) },
    }).lean();
  }

  return listBookings().find(
    (booking) =>
      booking.parkingSpotId === spotId &&
      booking.status === "booked" &&
      overlaps(booking.startTime, booking.endTime, startTime, endTime)
  );
}

async function listUserBookings(phone) {
  if (isDatabaseReady()) {
    const query = phone ? { customerPhone: normalizePhone(phone) } : {};
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
    return bookings.map(sanitizeBooking);
  }

  const normalizedPhone = normalizePhone(phone);
  const bookings = listBookings()
    .filter((booking) => !normalizedPhone || booking.customerPhone === normalizedPhone)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return bookings.map(sanitizeBooking);
}

router.get("/", async (req, res) => {
  try {
    const bookings = await listUserBookings(req.query.phone || "");
    res.json({
      source: isDatabaseReady() ? "database" : "mock",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

async function createBooking(req, res) {
  const {
    customerName,
    customerPhone,
    parkingSpotId,
    startTime,
    endTime,
  } = req.body;

  if (!customerName || !customerPhone || !parkingSpotId || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required booking details" });
  }

  const normalizedPhone = normalizePhone(customerPhone);
  const bookingStart = new Date(startTime);
  const bookingEnd = new Date(endTime);

  if (!normalizedPhone) {
    return res.status(400).json({ message: "Enter a valid phone number" });
  }

  if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) {
    return res.status(400).json({ message: "Start and end time must be valid dates" });
  }

  if (bookingEnd <= bookingStart) {
    return res.status(400).json({ message: "End time must be after start time" });
  }

  try {
    const spot = await getSpotById(parkingSpotId);

    if (!spot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    if (!spot.isAvailable) {
      return res.status(400).json({ message: "This parking spot is currently unavailable" });
    }

    const conflictingBooking = await findConflictingBooking(parkingSpotId, bookingStart, bookingEnd);

    if (conflictingBooking) {
      return res.status(409).json({ message: "This time slot is already booked for the selected spot" });
    }

    const durationHours = Math.max(1, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60)));
    const totalPrice = durationHours * (spot.price || 0);

    if (isDatabaseReady()) {
      const booking = await Booking.create({
        customerName: customerName.trim(),
        customerPhone: normalizedPhone,
        parkingSpotId,
        parkingSpotDescription: spot.description || spot.name || "Parking Spot",
        startTime: bookingStart,
        endTime: bookingEnd,
        totalPrice,
        source: "database",
      });

      return res.status(201).json({
        message: "Booking created successfully",
        booking: sanitizeBooking(booking),
      });
    }

    const mockBooking = addBooking({
      _id: new mongoose.Types.ObjectId().toString(),
      customerName: customerName.trim(),
      customerPhone: normalizedPhone,
      parkingSpotId,
      parkingSpotDescription: spot.description || spot.name || "Parking Spot",
      startTime: bookingStart.toISOString(),
      endTime: bookingEnd.toISOString(),
      totalPrice,
      status: "booked",
      source: "mock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking: sanitizeBooking(mockBooking),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create booking" });
  }
}

router.post("/", createBooking);
router.post("/book", createBooking);

router.patch("/:id/cancel", async (req, res) => {
  try {
    if (isDatabaseReady()) {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      booking.status = "cancelled";
      await booking.save();

      return res.json({
        message: "Booking cancelled successfully",
        booking: sanitizeBooking(booking),
      });
    }

    const booking = updateBooking(req.params.id, { status: "cancelled" });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({
      message: "Booking cancelled successfully",
      booking: sanitizeBooking(booking),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel booking" });
  }
});

module.exports = router;
