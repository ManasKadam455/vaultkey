const mongoose = require('mongoose');

/**
 * User Schema
 * 
 * WHY:
 * Represents registered users in MongoDB.
 * - Stores a hashed representation of the password (`passwordHash`) and NEVER
 *   the plaintext password, safeguarding user credentials even if database data is exposed.
 * - Enforces uniqueness and normalization on `email` to prevent duplicate or ambiguous accounts.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, // Normalizes email to avoid case-sensitive duplicate accounts
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
