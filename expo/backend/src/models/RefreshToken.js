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
    // Indexed via the TTL index below (schema.index with expireAfterSeconds),
    // so no inline `index: true` here (would duplicate).
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

// token and userId are already indexed inline (unique/index: true) — not
// re-declared here to avoid duplicate-index warnings.

// TTL index - MongoDB will automatically delete documents after they expire
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
