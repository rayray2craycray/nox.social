/**
 * BlockedUser Model
 * Stores user blocking relationships
 */

const mongoose = require('mongoose');

const BlockedUserSchema = new mongoose.Schema(
  {
    // User who initiated the block
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User who is being blocked
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Optional reason for blocking
    reason: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookups
BlockedUserSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

// Index for checking if a user is blocked
BlockedUserSchema.index({ blockedUserId: 1, blockerId: 1 });

// Static method to check if user A has blocked user B
BlockedUserSchema.statics.isBlocked = async function (blockerId, blockedUserId) {
  const block = await this.findOne({ blockerId, blockedUserId });
  return !!block;
};

// Static method to check if either user has blocked the other
BlockedUserSchema.statics.isEitherBlocked = async function (userId1, userId2) {
  const block = await this.findOne({
    $or: [
      { blockerId: userId1, blockedUserId: userId2 },
      { blockerId: userId2, blockedUserId: userId1 },
    ],
  });
  return !!block;
};

module.exports = mongoose.model('BlockedUser', BlockedUserSchema);
