/**
 * Email Verification Token Model
 * Tracks business email verification tokens
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmailVerificationTokenSchema = new Schema(
  {
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmailVerificationTokenSchema.index({ token: 1 }, { unique: true });
EmailVerificationTokenSchema.index({ businessProfileId: 1 });
// TTL index: automatically delete expired tokens
EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailVerificationToken', EmailVerificationTokenSchema);
