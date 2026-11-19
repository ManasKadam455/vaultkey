// routes/tools.routes.js
// Public routes for security tools, such as the k-anonymity breach check.

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { checkBreach } = require('../controllers/toolsController');

// Rate limiter for breach check endpoint (max 40 requests per 15 mins per IP)
const breachCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many breach check requests. Please try again later.' },
});

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/tools/breach-check
router.post(
  '/breach-check',
  breachCheckLimiter,
  [
    body('password')
      .notEmpty().withMessage('Password is required')
      .isString().withMessage('Password must be a string')
      .isLength({ max: 256 }).withMessage('Password cannot exceed 256 characters'),
  ],
  validate,
  checkBreach
);

module.exports = router;
