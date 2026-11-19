const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../middleware/validate.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new user, hashes password, returns JWT
 * @access  Public
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticates credentials and returns JWT
 * @access  Public (Rate limited: max 5 attempts per 15 mins)
 */
router.post(
  '/login',
  loginRateLimiter,
  loginValidation,
  handleValidationErrors,
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Returns current user's profile using the auth middleware
 * @access  Private (Requires Bearer token)
 */
router.get(
  '/me',
  verifyToken,
  getMe
);

module.exports = router;
