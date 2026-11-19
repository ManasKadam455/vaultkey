const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helper: Generate JWT Token
 * 
 * WHY:
 * Signs a stateless token containing the user's MongoDB `_id`.
 * Expires in '1d' (1 day) to balance user convenience with token theft risk.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, hash password, return JWT token
 * @access  Public
 * 
 * FLOW:
 * 1. Read validated `name`, `email`, `password` from req.body.
 * 2. Check if a user with the same email already exists (prevent duplicates).
 * 3. Generate a cryptographic salt and hash the password with bcrypt (salt rounds = 10).
 * 4. Save new User document with `passwordHash` to MongoDB.
 * 5. Generate a JWT token valid for 1 day.
 * 6. Return HTTP 201 with the JWT and safe user details (excluding passwordHash).
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'fail',
        message: 'An account with this email address already exists.'
      });
    }

    /**
     * PASSWORD HASHING: bcrypt
     * WHY:
     * Bcrypt is an adaptive hash function incorporating a work factor (salt rounds = 10).
     * It deliberately introduces computational cost (~100ms per hash), making offline
     * brute-force and rainbow table attacks computationally infeasible while remaining fast
     * for legitimate user logins.
     */
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user record in database
    const user = await User.create({
      name,
      email,
      passwordHash
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Return response excluding the sensitive passwordHash
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration. Please try again.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials, return JWT token
 * @access  Public (Rate limited: max 5 attempts / 15 mins)
 * 
 * FLOW:
 * 1. Read validated `email` and `password` from req.body.
 * 2. Lookup user record in MongoDB by email.
 * 3. Compare plaintext password with stored `passwordHash` using bcrypt.compare.
 * 4. If email is not found OR password does not match, return a GENERIC error message.
 *    (WHY: Prevents User Enumeration attacks — attackers cannot probe which emails are registered).
 * 5. If credentials match, generate a fresh 1-day JWT.
 * 6. Return HTTP 200 with JWT and user profile info.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Query user by email
    const user = await User.findOne({ email });

    // 2. Verify password with bcrypt.compare
    // Note: If user is not found, compare with a dummy hash to resist timing attacks (optional, but good practice).
    const isPasswordValid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // 3. Reject invalid credentials with a generic message
    if (!user || !isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send success response
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login. Please try again.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (Requires valid JWT via auth middleware)
 * 
 * WHY:
 * Demonstrates the auth middleware in action.
 * Fetches user profile using `req.user.id` and excludes `passwordHash`.
 */
const getMe = async (req, res) => {
  try {
    // Lookup user using authenticated req.user.id set by verifyToken middleware
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User account not found'
      });
    }

    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user profile.'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
