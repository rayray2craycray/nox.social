/**
 * Database Configuration
 * MongoDB connection setup
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pooling configuration
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10, // Max connections in pool
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5, // Min connections to maintain

      // Connection timeout settings
      serverSelectionTimeoutMS: 5000, // Timeout for initial connection
      socketTimeoutMS: 45000, // Socket timeout

      // Retry settings
      retryWrites: true, // Retry write operations
      retryReads: true, // Retry read operations
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.log('ℹ️  Continuing without MongoDB (using in-memory storage)');
    return null;
  }
};

module.exports = connectDB;
