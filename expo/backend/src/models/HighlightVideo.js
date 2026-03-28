/**
 * Highlight Video Model
 * Manages 15-second highlight videos (24-hour ephemeral content)
 */

const mongoose = require('mongoose');

const highlightVideoSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  venueId: {
    type: String,
    required: true,
    index: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  duration: {
    type: Number,
    required: true,
    max: 15, // 15 seconds max
  },
  caption: {
    type: String,
    maxlength: 200,
  },
  tags: [String],
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isExpired: {
    type: Boolean,
    default: false,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
highlightVideoSchema.index({ venueId: 1, isExpired: 1, expiresAt: 1 });
highlightVideoSchema.index({ userId: 1, createdAt: -1 });
highlightVideoSchema.index({ eventId: 1, isExpired: 1 });
highlightVideoSchema.index({ createdAt: -1, isExpired: 1 });

// Virtual to check if still active
highlightVideoSchema.virtual('isActive').get(function() {
  return !this.isExpired && this.expiresAt > new Date();
});

// Pre-save hook to set expiration (24 hours from creation)
highlightVideoSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

// Method to increment view
highlightVideoSchema.methods.incrementView = async function() {
  this.views += 1;
  return this.save();
};

// Method to like
highlightVideoSchema.methods.like = async function(userId) {
  if (this.likedBy.includes(userId)) {
    throw new Error('Already liked');
  }

  this.likedBy.push(userId);
  this.likes += 1;

  return this.save();
};

// Method to unlike
highlightVideoSchema.methods.unlike = async function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index === -1) {
    throw new Error('Not liked');
  }

  this.likedBy.splice(index, 1);
  this.likes -= 1;

  return this.save();
};

// Static method to get active highlights for venue
highlightVideoSchema.statics.getVenueHighlights = function(venueId, limit = 20) {
  return this.find({
    venueId,
    isExpired: false,
    expiresAt: { $gt: new Date() },
  })
    .populate('userId', 'displayName avatarUrl')
    .populate('eventId', 'title date')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get active highlights for event
highlightVideoSchema.statics.getEventHighlights = function(eventId, limit = 20) {
  return this.find({
    eventId,
    isExpired: false,
    expiresAt: { $gt: new Date() },
  })
    .populate('userId', 'displayName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get user's highlights
highlightVideoSchema.statics.getUserHighlights = function(userId, includeExpired = false) {
  const query = { userId };

  if (!includeExpired) {
    query.isExpired = false;
    query.expiresAt = { $gt: new Date() };
  }

  return this.find(query)
    .populate('eventId', 'title date')
    .sort({ createdAt: -1 })
    .limit(50);
};

// Static method to get trending highlights
highlightVideoSchema.statics.getTrending = function(limit = 20) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return this.find({
    isExpired: false,
    expiresAt: { $gt: new Date() },
    createdAt: { $gte: oneDayAgo },
  })
    .populate('userId', 'displayName avatarUrl')
    .populate('eventId', 'title date')
    .sort({ views: -1, likes: -1 })
    .limit(limit);
};

// Static method to get feed for user (from followed users)
highlightVideoSchema.statics.getFeedForUser = async function(userId, followedUserIds, limit = 30) {
  return this.find({
    userId: { $in: followedUserIds },
    isExpired: false,
    expiresAt: { $gt: new Date() },
  })
    .populate('userId', 'displayName avatarUrl')
    .populate('eventId', 'title date')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to expire old highlights
highlightVideoSchema.statics.expireOldHighlights = async function() {
  const now = new Date();

  const result = await this.updateMany(
    {
      isExpired: false,
      expiresAt: { $lt: now },
    },
    {
      isExpired: true,
    }
  );

  return result.modifiedCount;
};

// Static method to delete expired highlights (for cleanup)
highlightVideoSchema.statics.deleteExpiredHighlights = async function(olderThanDays = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await this.deleteMany({
    isExpired: true,
    expiresAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

// Static method to get highlights stats
highlightVideoSchema.statics.getStats = async function(venueId = null, eventId = null, userId = null) {
  const query = {};

  if (venueId) query.venueId = venueId;
  if (eventId) query.eventId = eventId;
  if (userId) query.userId = userId;

  const total = await this.countDocuments(query);
  const active = await this.countDocuments({
    ...query,
    isExpired: false,
    expiresAt: { $gt: new Date() },
  });

  const highlights = await this.find(query);
  const totalViews = highlights.reduce((sum, h) => sum + h.views, 0);
  const totalLikes = highlights.reduce((sum, h) => sum + h.likes, 0);

  return {
    total,
    active,
    expired: total - active,
    totalViews,
    totalLikes,
    avgViewsPerHighlight: total > 0 ? totalViews / total : 0,
    avgLikesPerHighlight: total > 0 ? totalLikes / total : 0,
  };
};

module.exports = mongoose.model('HighlightVideo', highlightVideoSchema);
