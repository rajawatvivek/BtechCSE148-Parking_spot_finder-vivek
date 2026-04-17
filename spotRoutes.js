const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Spot = require('../models/ParkingSpot');
const requireAdmin = require('../middleware/adminAuth');
const mockSpots = require('../data/mockSpots');
const {
  addSpot,
  deleteSpot,
  findSpotById,
  listSpots,
  updateSpot,
} = require('../data/mockSpotsStore');

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

function getDistance(lat1, lng1, lat2, lng2) {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

function filterNearbySpots(spots, lat, lng, radius) {
  return spots.filter((spot) => {
    if (!spot.location) {
      return false;
    }

    const distance = getDistance(lat, lng, spot.location.lat, spot.location.lng);
    return distance <= radius;
  });
}

function sanitizeSpot(spot) {
  if (!spot) {
    return null;
  }

  const plainSpot = spot.toObject ? spot.toObject() : spot;
  const id = String(plainSpot._id || plainSpot.id);
  const name = plainSpot.name || plainSpot.description || 'Parking Spot';
  const totalSlots = Number.isFinite(Number(plainSpot.totalSlots))
    ? Number(plainSpot.totalSlots)
    : 1;
  const availableSlots = Number.isFinite(Number(plainSpot.availableSlots))
    ? Math.max(0, Number(plainSpot.availableSlots))
    : plainSpot.isAvailable
      ? totalSlots
      : 0;
  const isAvailable =
    typeof plainSpot.isAvailable === 'boolean'
      ? plainSpot.isAvailable
      : availableSlots > 0;

  return {
    ...plainSpot,
    id,
    name,
    description: plainSpot.description || name,
    totalSlots,
    availableSlots: Math.min(availableSlots, totalSlots),
    isAvailable,
    location: {
      lat: plainSpot.location?.lat,
      lng: plainSpot.location?.lng,
      address: plainSpot.location?.address || '',
    },
  };
}

function validateSpotPayload(payload, { partial = false } = {}) {
  const errors = [];
  const nextSpot = {};

  if (!partial || payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    if (!name) {
      errors.push('Parking spot name is required.');
    } else {
      nextSpot.name = name;
      nextSpot.description = name;
    }
  }

  if (!partial || payload.location !== undefined) {
    const location = payload.location || {};
    const lat = toNumber(location.lat);
    const lng = toNumber(location.lng);
    const address = String(location.address || '').trim();

    if (lat === null) {
      errors.push('Valid latitude is required.');
    }

    if (lng === null) {
      errors.push('Valid longitude is required.');
    }

    if (lat !== null && lng !== null) {
      nextSpot.location = { lat, lng, address };
    }
  }

  if (!partial || payload.price !== undefined) {
    const price = toNumber(payload.price);
    if (price === null || price < 0) {
      errors.push('Price must be a valid non-negative number.');
    } else {
      nextSpot.price = price;
    }
  }

  if (!partial || payload.totalSlots !== undefined) {
    const totalSlots = toNumber(payload.totalSlots);
    if (totalSlots === null || totalSlots < 1) {
      errors.push('Total slots must be at least 1.');
    } else {
      nextSpot.totalSlots = Math.floor(totalSlots);
    }
  }

  if (payload.availableSlots !== undefined) {
    const availableSlots = toNumber(payload.availableSlots);
    if (availableSlots === null || availableSlots < 0) {
      errors.push('Available slots must be a valid non-negative number.');
    } else {
      nextSpot.availableSlots = Math.floor(availableSlots);
    }
  }

  if (payload.isAvailable !== undefined) {
    nextSpot.isAvailable = Boolean(payload.isAvailable);
  }

  if (payload.timeLimit !== undefined) {
    nextSpot.timeLimit = String(payload.timeLimit || '').trim() || 'Flexible';
  }

  if (!errors.length) {
    const totalSlots = nextSpot.totalSlots;
    const availableSlots =
      nextSpot.availableSlots !== undefined
        ? nextSpot.availableSlots
        : totalSlots !== undefined
          ? totalSlots
          : undefined;

    if (availableSlots !== undefined && totalSlots !== undefined && availableSlots > totalSlots) {
      errors.push('Available slots cannot be greater than total slots.');
    }

    if (!errors.length) {
      if (availableSlots !== undefined) {
        nextSpot.availableSlots = availableSlots;
      }

      if (nextSpot.isAvailable === undefined) {
        nextSpot.isAvailable = availableSlots === undefined ? true : availableSlots > 0;
      } else if (!nextSpot.isAvailable) {
        nextSpot.availableSlots = 0;
      } else if (nextSpot.availableSlots === undefined && totalSlots !== undefined) {
        nextSpot.availableSlots = totalSlots;
      }
    }
  }

  return {
    errors,
    value: nextSpot,
  };
}

async function fetchAllSpots() {
  if (isDatabaseReady()) {
    const spots = await Spot.find().sort({ createdAt: -1 }).lean();
    return {
      source: 'database',
      spots: spots.map(sanitizeSpot),
    };
  }

  return {
    source: 'mock',
    spots: listSpots().map(sanitizeSpot),
  };
}

async function fetchSpotById(id) {
  if (isDatabaseReady()) {
    const spot = await Spot.findById(id).lean();
    return spot ? sanitizeSpot(spot) : null;
  }

  return sanitizeSpot(findSpotById(id));
}

// ADMIN: list all parking spots
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const result = await fetchAllSpots();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch parking spots.' });
  }
});

// ADMIN: create a parking spot
router.post('/admin', requireAdmin, async (req, res) => {
  const { errors, value } = validateSpotPayload(req.body);

  if (errors.length) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  try {
    if (isDatabaseReady()) {
      const spot = new Spot(value);
      const savedSpot = await spot.save();
      return res.status(201).json({
        message: 'Parking spot created successfully.',
        source: 'database',
        spot: sanitizeSpot(savedSpot),
      });
    }

    const savedSpot = addSpot(value);
    return res.status(201).json({
      message: 'Parking spot created successfully.',
      source: 'mock',
      spot: sanitizeSpot(savedSpot),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to create parking spot.' });
  }
});

// ADMIN: update a parking spot
router.put('/admin/:id', requireAdmin, async (req, res) => {
  const { errors, value } = validateSpotPayload(req.body);

  if (errors.length) {
    return res.status(400).json({ message: errors.join(' ') });
  }

  try {
    if (isDatabaseReady()) {
      const updatedSpot = await Spot.findByIdAndUpdate(req.params.id, value, {
        new: true,
        runValidators: true,
      });

      if (!updatedSpot) {
        return res.status(404).json({ message: 'Parking spot not found.' });
      }

      return res.json({
        message: 'Parking spot updated successfully.',
        source: 'database',
        spot: sanitizeSpot(updatedSpot),
      });
    }

    const updatedSpot = updateSpot(req.params.id, value);

    if (!updatedSpot) {
      return res.status(404).json({ message: 'Parking spot not found.' });
    }

    return res.json({
      message: 'Parking spot updated successfully.',
      source: 'mock',
      spot: sanitizeSpot(updatedSpot),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Unable to update parking spot.' });
  }
});

// ADMIN: delete a parking spot
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try {
    if (isDatabaseReady()) {
      const deletedSpot = await Spot.findByIdAndDelete(req.params.id);

      if (!deletedSpot) {
        return res.status(404).json({ message: 'Parking spot not found.' });
      }

      return res.json({
        message: 'Parking spot deleted successfully.',
        source: 'database',
      });
    }

    const deletedSpot = deleteSpot(req.params.id);

    if (!deletedSpot) {
      return res.status(404).json({ message: 'Parking spot not found.' });
    }

    return res.json({
      message: 'Parking spot deleted successfully.',
      source: 'mock',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete parking spot.' });
  }
});

// ADMIN: toggle availability
router.patch('/admin/:id/availability', requireAdmin, async (req, res) => {
  try {
    const currentSpot = await fetchSpotById(req.params.id);

    if (!currentSpot) {
      return res.status(404).json({ message: 'Parking spot not found.' });
    }

    const nextIsAvailable =
      typeof req.body?.isAvailable === 'boolean' ? req.body.isAvailable : !currentSpot.isAvailable;
    const nextAvailableSlots = nextIsAvailable
      ? Math.max(currentSpot.availableSlots || 0, 1)
      : 0;
    const updates = {
      isAvailable: nextIsAvailable,
      availableSlots: Math.min(nextAvailableSlots, currentSpot.totalSlots || 1),
    };

    if (isDatabaseReady()) {
      const updatedSpot = await Spot.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      return res.json({
        message: `Parking spot marked as ${nextIsAvailable ? 'available' : 'unavailable'}.`,
        source: 'database',
        spot: sanitizeSpot(updatedSpot),
      });
    }

    const updatedSpot = updateSpot(req.params.id, updates);
    return res.json({
      message: `Parking spot marked as ${nextIsAvailable ? 'available' : 'unavailable'}.`,
      source: 'mock',
      spot: sanitizeSpot(updatedSpot),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to toggle parking spot availability.' });
  }
});

// GET nearby available spots
router.get('/', async (req, res) => {
  const lat = toNumber(req.query.lat);
  const lng = toNumber(req.query.lng);
  const radius = toNumber(req.query.radius) ?? 0.01;
  const forceMock = req.query.mock === 'true';

  if (lat === null || lng === null) {
    return res.status(400).json({ message: 'Missing or invalid lat/lng query parameters' });
  }

  try {
    const shouldUseMock = forceMock || !isDatabaseReady();
    const spots = shouldUseMock
      ? listSpots().map(sanitizeSpot).filter((spot) => spot.isAvailable)
      : (await Spot.find({ isAvailable: true }).lean()).map(sanitizeSpot);

    const nearbySpots = filterNearbySpots(spots, lat, lng, radius);

    res.json({
      source: shouldUseMock ? 'mock' : 'database',
      count: nearbySpots.length,
      spots: nearbySpots,
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch parking spots' });
  }
});

module.exports = router;
