const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 * 
 * WHY:
 * Centralizing the database connection in a config module keeps server.js clean
 * and provides a single place to manage connection options, event listeners,
 * and graceful reconnects.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn('⚠️ [MongoDB Warning] MONGO_URI is not defined in your .env file.');
    console.warn('⚠️ Please add your MongoDB connection string to server/.env');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) if MongoDB is unreachable
    });
    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    // In production or critical setups, you may choose process.exit(1),
    // but during initial setup we log the error clearly so the developer can diagnose.
  }
};

module.exports = connectDB;
