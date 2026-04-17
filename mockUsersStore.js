const users = [];

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
  };
}

function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => user.email === normalizedEmail) || null;
}

function addUser({ name, email, passwordHash, role = "user" }) {
  const user = {
    id: String(users.length + 1),
    name: String(name).trim(),
    email: normalizeEmail(email),
    passwordHash,
    role,
  };

  users.push(user);
  return user;
}

module.exports = {
  addUser,
  findUserByEmail,
  normalizeEmail,
  sanitizeUser,
};
