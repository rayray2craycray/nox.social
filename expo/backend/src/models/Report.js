/**
 * Report Model
 * Stores user-generated content reports for moderation
 */

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    // Reporter information
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Reported content details
    contentType: {
      type: String,
      enum: ['video', 'user', 'comment', 'message'],
      required: true,
      index: true,
    },

    contentId: {
      type: String,
      required: true,
      index: true,
    },

    // Optional: Reported user (for user reports or content owned by a user)
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Report details
    reason: {
      type: String,
      required: true,
      enum: [
        // Video reasons
        'inappropriate',
        'spam',
        'harassment',
        'hate_speech',
        'copyright',
        'dangerous',
        // User reasons
        'fake_account',
        'underage',
        // Comment/message reasons
        'scam',
        // Generic
        'other',
      ],
    },

    details: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    // Moderation status
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },

    // Moderation outcome
    moderationAction: {
      type: String,
      enum: [
        'NONE',
        'CONTENT_REMOVED',
        'USER_WARNED',
        'USER_SUSPENDED',
        'USER_BANNED',
      ],
      default: 'NONE',
    },

    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    moderatorNotes: {
      type: String,
      maxlength: 1000,
    },

    reviewedAt: {
      type: Date,
    },

    // Metadata
    reporterIP: {
      type: String,
      select: false, // Hidden by default
    },

    priority: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding reports on specific content
ReportSchema.index({ contentType: 1, contentId: 1 });

// Index for finding all reports by a user
ReportSchema.index({ reporterId: 1, createdAt: -1 });

// Index for moderation queue
ReportSchema.index({ status: 1, priority: -1, createdAt: 1 });

// Prevent duplicate reports (same reporter + content within 30 days)
ReportSchema.index(
  { reporterId: 1, contentType: 1, contentId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Report', ReportSchema);
