const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * 
 * WHY:
 * 1. Protects private routes by requiring a valid JSON Web Token (JWT).
 * 2. Extracts and verifies the token from the standard `Authorization: Bearer <token>` header.
 * 3. Decodes the user ID and attaches it to `req.user`.
 * 
 * CRITICAL ARCHITECTURAL ROLE:
 * In a multi-tenant password vault, every database query must strictly filter
 * by the authenticated user's ID. Attaching `req.user = { id: decoded.id }` ensures
 * all subsequent controllers know exactly who is making the request without trusting
 * client-supplied query parameters or body payloads.
 */
const verifyToken = (req, res, next) => {
  // Read the Authorization header
  const authHeader = req.headers.authorization;

  // Check if header is present and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'fail',
      message: 'Access denied. No authorization token provided.'
    });
  }

  // Extract the raw token string (removing 'Bearer ')
  const token = authHeader.split(' ')[1];

  try {
    // Verify token signature against JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user payload to request for downstream controllers
    req.user = {
      id: decoded.id
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      status: 'fail',
      message: 'Invalid authorization token.'
    });
  }
};

module.exports = verifyToken;
