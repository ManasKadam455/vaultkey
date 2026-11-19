const path = require('path');
// Load environment variables as early as possible so all modules have access
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Route imports
const healthRoutes = require('./routes/health.routes');
const authRoutes   = require('./routes/auth.routes');
const vaultRoutes  = require('./routes/vault.routes');
const toolsRoutes  = require('./routes/tools.routes');

// Initialize the Express application
const app = express();

// Connect to MongoDB
connectDB();

/**
 * SECURITY MIDDLEWARE: Helmet
 * WHY:
 * Helmet sets HTTP security headers (e.g. Content-Security-Policy, X-Frame-Options,
 * Strict-Transport-Security, X-Content-Type-Options) to protect against common
 * web vulnerabilities like Cross-Site Scripting (XSS), clickjacking, and MIME-sniffing.
 */
app.use(helmet());

/**
 * SECURITY MIDDLEWARE: CORS (Cross-Origin Resource Sharing)
 * WHY:
 * Restricts which origins (domains/ports) are permitted to make HTTP requests
 * to this API. Preventing arbitrary origins protects sensitive vault endpoints
 * from unauthorized third-party websites executing requests on a user's behalf.
 */
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true, // Allow cookies / authorization headers across origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

/**
 * SECURITY MIDDLEWARE: Rate Limiting
 * WHY:
 * Restricts the number of requests a single IP address can make within a given
 * time window. This mitigates Denial of Service (DoS) attacks and brute-force
 * guessing attacks against authentication and sensitive API endpoints.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per 15-minute window
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable the deprecated `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', generalLimiter);

/**
 * BODY PARSER: express.json()
 * WHY:
 * Safely parses incoming JSON request bodies with a size limit (10kb) to prevent
 * memory exhaustion from overly large payloads (Payload Too Large attacks).
 */
app.use(express.json({ limit: '10kb' }));

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth',  authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/tools', toolsRoutes);

// Fallback 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    error: err.message || 'Internal Server Error',
    message: err.message || 'Internal Server Error'
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 [VaultKey Server] Listening on port ${PORT}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
});
