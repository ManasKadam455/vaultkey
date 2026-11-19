const rateLimit = require('express-rate-limit');

/**
 * TIGHT RATE LIMITER: Login Endpoint
 * 
 * WHY:
 * Limits login attempts to a maximum of 5 requests per 15 minutes per IP address.
 * This directly protects the system against:
 * 1. Brute-force attacks attempting to guess passwords.
 * 2. Automated credential stuffing attacks using leaked username/password combos.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: 5, // Limit each IP to 5 login attempts per window
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable deprecated X-RateLimit-* headers
  message: {
    status: 'fail',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  }
});

module.exports = {
  loginRateLimiter
};
