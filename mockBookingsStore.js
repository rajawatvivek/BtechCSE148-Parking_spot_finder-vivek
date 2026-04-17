const mockBookings = [];

function listBookings() {
  return [...mockBookings];
}

function addBooking(booking) {
  mockBookings.push(booking);
  return booking;
}

function updateBooking(id, updates) {
  const index = mockBookings.findIndex((booking) => booking._id === id);

  if (index === -1) {
    return null;
  }

  mockBookings[index] = {
    ...mockBookings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return mockBookings[index];
}

module.exports = {
  addBooking,
  listBookings,
  updateBooking,
};
