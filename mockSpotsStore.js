const mockSpots = require('./mockSpots');

function createId() {
  return `mock-spot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneSpot(spot) {
  return JSON.parse(JSON.stringify(spot));
}

function listSpots() {
  return mockSpots.map(cloneSpot);
}

function findSpotById(id) {
  const spot = mockSpots.find((item) => item.id === id);
  return spot ? cloneSpot(spot) : null;
}

function addSpot(spot) {
  const nextSpot = {
    id: createId(),
    ...cloneSpot(spot),
  };

  mockSpots.push(nextSpot);
  return cloneSpot(nextSpot);
}

function updateSpot(id, updates) {
  const index = mockSpots.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  mockSpots[index] = {
    ...mockSpots[index],
    ...cloneSpot(updates),
  };

  return cloneSpot(mockSpots[index]);
}

function deleteSpot(id) {
  const index = mockSpots.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const [deletedSpot] = mockSpots.splice(index, 1);
  return cloneSpot(deletedSpot);
}

module.exports = {
  addSpot,
  deleteSpot,
  findSpotById,
  listSpots,
  updateSpot,
};
