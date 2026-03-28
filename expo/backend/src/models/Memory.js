/**
 * Memory Model
 * Manages user memories and timeline for retention
 */

const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
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
  date: {
    type: Date,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['CHECK_IN', 'VIDEO', 'PHOTO', 'MILESTONE', 'ACHIEVEMENT', 'SPECIAL_MOMENT'],
    required: true,
    index: true,
  },
  content: {
    imageUrl: String,
    videoUrl: String,
    caption: {
      type: String,
      maxlength: 500,
    },
    metadata: mongoose.Schema.Types.Mixed, // Store additional data like location, tags, etc.
  },
  friendsTagged: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  tags: [String],
  mood: {
    type: String,
    enum: ['AMAZING', 'GREAT', 'GOOD', 'OKAY', 'MEH'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
memorySchema.index({ userId: 1, date: -1 });
memorySchema.index({ venueId: 1, date: -1 });
memorySchema.index({ userId: 1, isPrivate: 1 });
memorySchema.index({ 'friendsTagged': 1 });

// Method to add like
memorySchema.methods.addLike = async function(userId) {
  if (this.likedBy.includes(userId)) {
    throw new Error('Already liked');
  }

  this.likedBy.push(userId);
  this.likes += 1;

  return this.save();
};

// Method to remove like
memorySchema.methods.removeLike = async function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index === -1) {
    throw new Error('Not liked');
  }

  this.likedBy.splice(index, 1);
  this.likes -= 1;

  return this.save();
};

// Method to add comment
memorySchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date(),
  });

  return this.save();
};

// Method to remove comment
memorySchema.methods.removeComment = async function(commentId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  comment.remove();
  return this.save();
};

// Static method to get user's timeline
memorySchema.statics.getUserTimeline = function(userId, options = {}) {
  const {
    startDate,
    endDate,
    venueId,
    type,
    includePrivate = true,
    limit = 50,
    skip = 0,
  } = options;

  const query = { userId };

  if (!includePrivate) {
    query.isPrivate = false;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (venueId) query.venueId = venueId;
  if (type) query.type = type;

  return this.find(query)
    .populate('eventId', 'title date')
    .populate('friendsTagged', 'displayName avatarUrl')
    .populate('comments.userId', 'displayName avatarUrl')
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get venue memories
memorySchema.statics.getVenueMemories = function(venueId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return this.find({
    venueId,
    isPrivate: false,
  })
    .populate('userId', 'displayName avatarUrl')
    .populate('eventId', 'title date')
    .sort({ date: -1, likes: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get memories with tagged user
memorySchema.statics.getTaggedMemories = function(userId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return this.find({
    friendsTagged: userId,
    isPrivate: false,
  })
    .populate('userId', 'displayName avatarUrl')
    .populate('eventId', 'title date')
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get memories by date range (for "On This Day" feature)
memorySchema.statics.getOnThisDay = function(userId, monthDay) {
  // monthDay format: "MM-DD"
  const [month, day] = monthDay.split('-').map(Number);

  // Find memories from previous years on this day
  return this.find({
    userId,
    $expr: {
      $and: [
        { $eq: [{ $month: '$date' }, month] },
        { $eq: [{ $dayOfMonth: '$date' }, day] },
        { $lt: [{ $year: '$date' }, new Date().getFullYear()] },
      ],
    },
  })
    .populate('eventId', 'title date')
    .populate('friendsTagged', 'displayName avatarUrl')
    .sort({ date: -1 });
};

// Static method to get memory stats
memorySchema.statics.getStats = async function(userId = null, venueId = null) {
  const query = {};
  if (userId) query.userId = userId;
  if (venueId) query.venueId = venueId;

  const memories = await this.find(query);

  const stats = {
    total: memories.length,
    byType: {},
    totalLikes: 0,
    totalComments: 0,
    avgRating: 0,
    moodBreakdown: {},
    venuesVisited: new Set(),
    friendsTagged: new Set(),
  };

  memories.forEach(memory => {
    // Count by type
    if (!stats.byType[memory.type]) {
      stats.byType[memory.type] = 0;
    }
    stats.byType[memory.type] += 1;

    // Aggregate likes and comments
    stats.totalLikes += memory.likes;
    stats.totalComments += memory.comments.length;

    // Calculate average rating
    if (memory.rating) {
      stats.avgRating += memory.rating;
    }

    // Mood breakdown
    if (memory.mood) {
      if (!stats.moodBreakdown[memory.mood]) {
        stats.moodBreakdown[memory.mood] = 0;
      }
      stats.moodBreakdown[memory.mood] += 1;
    }

    // Unique venues and friends
    stats.venuesVisited.add(memory.venueId);
    memory.friendsTagged.forEach(friendId => {
      stats.friendsTagged.add(friendId.toString());
    });
  });

  // Calculate averages
  if (memories.length > 0) {
    const ratedMemories = memories.filter(m => m.rating).length;
    if (ratedMemories > 0) {
      stats.avgRating /= ratedMemories;
    }
  }

  // Convert sets to counts
  stats.venuesVisited = stats.venuesVisited.size;
  stats.friendsTagged = stats.friendsTagged.size;

  return stats;
};

// Static method to create auto-generated memories
memorySchema.statics.createAutoMemory = async function(data) {
  const {
    userId,
    venueId,
    eventId,
    type,
    content,
  } = data;

  const memory = await this.create({
    userId,
    venueId,
    eventId,
    date: new Date(),
    type,
    content,
    isPrivate: false, // Auto-generated memories are public by default
  });

  return memory;
};

// Static method to get highlights (most liked/commented)
memorySchema.statics.getHighlights = function(userId, options = {}) {
  const { limit = 10, startDate, endDate } = options;

  const query = { userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('eventId', 'title date')
    .populate('friendsTagged', 'displayName avatarUrl')
    .sort({ likes: -1, 'comments.length': -1 })
    .limit(limit);
};

module.exports = mongoose.model('Memory', memorySchema);
