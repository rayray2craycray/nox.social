/**
 * RefreshToken Model
 * Stores refresh tokens for JWT authentication with revocation support
 */

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  revokedAt: {
    type: Date,
    default: null,
  },

  isRevoked: {
    type: Boolean,
    default: false,
  },
});

// Indexes for performance
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });

// TTL index - MongoDB will automatically delete documents after they expire
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
