const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint reporting API status and MongoDB connection state
 * @access  Public
 */
router.get('/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStatus = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    message: 'VaultKey API is running smoothly',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

module.exports = router;
