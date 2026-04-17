const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const {
  addUser,
  findUserByEmail,
  normalizeEmail,
  sanitizeUser,
} = require("../data/mockUsersStore");

const router = express.Router();

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function createToken(user) {
  const payload = {
    sub: String(user._id || user.id),
    email: user.email,
    role: user.role || "user",
    issuedAt: Date.now(),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function validateAuthInput(name, email, password, requireName = false) {
  if (requireName && !String(name || "").trim()) {
    return "Name is required.";
  }

  if (!String(email || "").trim()) {
    return "Email is required.";
  }

  if (!String(password || "").trim()) {
    return "Password is required.";
  }

  if (String(password).length < 6) {
    return "Password must be at least 6 characters long.";
  }

  return "";
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const validationError = validateAuthInput(name, email, password, true);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordHash = hashPassword(password);

    if (isDatabaseReady()) {
      const existingUser = await User.findOne({ email: normalizedEmail }).lean();

      if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email." });
      }

      const createdUser = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: "user",
      });

      return res.status(201).json({
        message: "Registration successful.",
        user: {
          id: String(createdUser._id),
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role || "user",
        },
      });
    }

    const existingMockUser = findUserByEmail(normalizedEmail);

    if (existingMockUser) {
      return res.status(409).json({ message: "User already exists with this email." });
    }

    const createdUser = addUser({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to register user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const validationError = validateAuthInput("", email, password);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordHash = hashPassword(password);

    if (isDatabaseReady()) {
      const user = await User.findOne({ email: normalizedEmail });

      if (!user || user.passwordHash !== passwordHash) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      return res.json({
        token: createToken(user),
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role || "user",
        },
      });
    }

    const user = findUserByEmail(normalizedEmail);

    if (!user || user.passwordHash !== passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      token: createToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to login." });
  }
});

module.exports = router;
