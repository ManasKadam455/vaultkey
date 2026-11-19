// controllers/authController.js
// Contains the business logic for register and login.
// Routes call these functions; they don't know about HTTP details.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// --- Helper: sign a JWT for a given user ---
// Keeping this in one place means the token structure is always consistent.
// The payload contains only the user's id — the minimum needed to identify
// them on subsequent requests. Never put the password hash in the token.
const signToken = (userId) => {
  return jwt.sign(
    { id: userId },                   // payload
    process.env.JWT_SECRET,           // secret from .env — never hardcoded
    { expiresIn: '1d' }               // token expires in 1 day
  );
};

// ─────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────
// Flow:
//   1. Check express-validator results
//   2. Make sure email is not already taken
//   3. Hash the password with bcrypt (cost factor 12)
//   4. Save the new user document
//   5. Return a signed JWT so the user is immediately logged in
const register = async (req, res, next) => {
  // 1. If the validation middleware found errors, return them all at once
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Fast check: verify MongoDB connection is active
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database offline: Cannot connect to MongoDB. Please ensure your MongoDB Atlas URI in server/.env is valid and your IP is whitelisted.',
    });
  }

  const { name, email, password } = req.body;

  try {
    // 2. Duplicate email check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Return 409 Conflict — the resource (this email) already exists
      return res.status(409).json({ error: 'Email already in use' });
    }

    // 3. Hash the password
    // WHY cost factor 12?
    // bcrypt's cost factor (salt rounds) controls how slow the hash is.
    // Higher = more CPU time per attempt, making brute-force attacks far
    // more expensive. 12 is a good balance for 2024 hardware (~250ms/hash).
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Save to MongoDB
    const user = await User.create({ name, email, passwordHash });

    // 5. Issue JWT
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user, // passwordHash is stripped by toJSON on the model
    });
  } catch (err) {
    // Pass unexpected errors to the global error handler in server.js
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────
// Flow:
//   1. Check express-validator results
//   2. Find the user by email
//   3. Compare the submitted password against the stored hash
//   4. Return a signed JWT
const login = async (req, res, next) => {
  // 1. Validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Fast check: verify MongoDB connection is active
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database offline: Cannot connect to MongoDB. Please ensure your MongoDB Atlas URI in server/.env is valid and your IP is whitelisted.',
    });
  }

  const { email, password } = req.body;

  try {
    // 2. Look up user — we need the hash to compare, so select it back in
    // (passwordHash is not in the default toJSON but we need it here)
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      // WHY the same message for wrong email AND wrong password?
      // Different messages would let an attacker enumerate valid emails
      // ("account not found" vs "wrong password"). A generic message
      // gives them nothing useful.
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Compare submitted password against stored hash
    // bcrypt.compare hashes the input with the same salt and checks equality.
    // It is intentionally slow — that's the point.
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Issue JWT
    const token = signToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user, // toJSON strips passwordHash before this is serialised
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
