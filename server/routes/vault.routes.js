// routes/vault.routes.js
// All vault routes sit behind the 'protect' middleware.
// router.use(protect) at the top means every route in this file requires a
// valid JWT — no need to add it individually to each route handler.

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
  getCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
} = require('../controllers/vaultController');

// Apply auth middleware to every route in this router
router.use(protect);

// --- Validation for creating a new credential (all required fields) ---
const createValidation = [
  body('siteName')
    .trim()
    .notEmpty().withMessage('Site name is required')
    .isLength({ max: 100 }).withMessage('Site name cannot exceed 100 characters'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ max: 100 }).withMessage('Username cannot exceed 100 characters'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  // siteUrl is optional; only validate format when it's provided and non-empty
  body('siteUrl')
    .optional({ values: 'falsy' }) // skip validation if empty string or omitted
    .trim()
    .isURL({ require_protocol: true }).withMessage('Site URL must be a valid URL (include https://)'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
];

// --- Validation for updates (all fields optional, but must be valid if present) ---
const updateValidation = [
  body('siteName')
    .optional()
    .trim()
    .notEmpty().withMessage('Site name cannot be empty')
    .isLength({ max: 100 }).withMessage('Site name cannot exceed 100 characters'),

  body('username')
    .optional()
    .trim()
    .notEmpty().withMessage('Username cannot be empty')
    .isLength({ max: 100 }).withMessage('Username cannot exceed 100 characters'),

  body('password')
    .optional()
    .notEmpty().withMessage('Password cannot be empty'),

  body('siteUrl')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ require_protocol: true }).withMessage('Site URL must be a valid URL (include https://)'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
];

// ── Routes ───────────────────────────────────────────────────────
router.get('/',    getCredentials);
router.post('/',   createValidation, createCredential);
router.put('/:id', updateValidation, updateCredential);
router.delete('/:id',               deleteCredential);

module.exports = router;
