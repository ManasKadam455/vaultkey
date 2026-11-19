// middleware/authMiddleware.js
// Protects routes that require a logged-in user.
//
// Flow:
//   1. Read the Authorization header ("Bearer <token>")
//   2. Verify the token signature and expiry with jwt.verify
//   3. Load the user from DB (confirms they still exist and aren't deleted)
//   4. Attach user to req.user so controllers can access it
//   5. Call next() to continue to the actual route handler

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Extract token from the Authorization header
  // The header format is: "Bearer eyJhbGci..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  try {
    // 2. Verify the token's signature and that it hasn't expired.
    // jwt.verify throws if either check fails, so we wrap in try/catch.
    // WHY check signature? The JWT_SECRET is only known to our server, so
    // only we could have signed a valid token. This prevents forgery.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch the user from DB using the id baked into the token payload.
    // WHY re-fetch from DB? The token could be valid but the user may have
    // been deleted. Checking the DB on every request catches this case.
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    // 4. Attach the user document to the request object.
    // Every subsequent middleware and controller in this request can now
    // access req.user without making another DB call.
    req.user = user;

    // 5. Hand off to the next middleware or route handler
    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError (bad signature) or
    // TokenExpiredError (expired). Both should return 401.
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { protect };
