/**
 * Streak Model
 * Manages user streaks for engagement and retention
 */

const mongoose = require('mongoose');

const streakMilestoneSchema = new mongoose.Schema({
  milestone: {
    type: Number,
    required: true,
  },
  rewardType: {
    type: String,
    enum: ['DISCOUNT', 'FREE_ITEM', 'VIP_ACCESS', 'BADGE', 'POINTS'],
  },
  rewardValue: mongoose.Schema.Types.Mixed,
  rewardDescription: String,
  achievedAt: Date,
  claimed: {
    type: Boolean,
    default: false,
  },
  claimedAt: Date,
});

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['WEEKEND_WARRIOR', 'VENUE_LOYALTY', 'SOCIAL_BUTTERFLY', 'EVENT_GOER', 'DAILY_CHECK_IN'],
    required: true,
    index: true,
  },
  venueId: {
    type: String,
    index: true,
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastActivityDate: {
    type: Date,
    index: true,
  },
  lastActivityType: {
    type: String,
    enum: ['CHECK_IN', 'TICKET_PURCHASE', 'FRIEND_INVITE', 'VIDEO_UPLOAD', 'CHALLENGE_COMPLETE'],
  },
  totalActivities: {
    type: Number,
    default: 0,
  },
  milestones: [streakMilestoneSchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  metadata: {
    startDate: Date,
    pausedAt: Date,
    resumedAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes
streakSchema.index({ userId: 1, type: 1 });
streakSchema.index({ userId: 1, isActive: 1 });
streakSchema.index({ type: 1, currentStreak: -1 });

// Virtual for streak status
streakSchema.virtual('status').get(function() {
  if (!this.lastActivityDate) return 'NEW';

  const daysSinceActivity = Math.floor((Date.now() - this.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceActivity === 0) return 'ACTIVE';
  if (daysSinceActivity === 1) return 'AT_RISK';
  if (daysSinceActivity >= 2) return 'BROKEN';

  return 'ACTIVE';
});

// Method to increment streak
streakSchema.methods.incrementStreak = async function(activityType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already counted today
  if (this.lastActivityDate) {
    const lastActivity = new Date(this.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    if (lastActivity.getTime() === today.getTime()) {
      // Already counted today, just update activity type
      this.lastActivityType = activityType;
      return this.save();
    }

    // Check if streak is broken (more than 1 day gap)
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) {
      // Streak broken, reset
      this.currentStreak = 1;
    } else {
      // Consecutive day, increment
      this.currentStreak += 1;
    }
  } else {
    // First activity
    this.currentStreak = 1;
    this.metadata.startDate = today;
  }

  // Update longest streak
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }

  this.lastActivityDate = new Date();
  this.lastActivityType = activityType;
  this.totalActivities += 1;

  // Check for milestone achievements
  await this.checkMilestones();

  return this.save();
};

// Method to check and add milestones
streakSchema.methods.checkMilestones = async function() {
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  const rewardMap = {
    7: { type: 'DISCOUNT', value: 10, desc: '10% off your next visit' },
    14: { type: 'FREE_ITEM', value: 'drink', desc: 'Free drink on your next visit' },
    30: { type: 'VIP_ACCESS', value: true, desc: 'VIP access for a month' },
    60: { type: 'DISCOUNT', value: 20, desc: '20% off your next visit' },
    90: { type: 'BADGE', value: 'LEGEND', desc: 'Legendary status badge' },
    180: { type: 'FREE_ITEM', value: 'bottle', desc: 'Free bottle service' },
    365: { type: 'VIP_ACCESS', value: true, desc: 'Lifetime VIP access' },
  };

  for (const milestone of milestones) {
    if (this.currentStreak >= milestone) {
      // Check if milestone already exists
      const existing = this.milestones.find(m => m.milestone === milestone);
      if (!existing) {
        const reward = rewardMap[milestone];
        this.milestones.push({
          milestone,
          rewardType: reward.type,
          rewardValue: reward.value,
          rewardDescription: reward.desc,
          achievedAt: new Date(),
        });
      }
    }
  }
};

// Method to claim milestone reward
streakSchema.methods.claimMilestone = async function(milestone) {
  const milestoneEntry = this.milestones.find(m => m.milestone === milestone);
  if (!milestoneEntry) {
    throw new Error('Milestone not found');
  }

  if (milestoneEntry.claimed) {
    throw new Error('Milestone already claimed');
  }

  milestoneEntry.claimed = true;
  milestoneEntry.claimedAt = new Date();

  return this.save();
};

// Method to break streak
streakSchema.methods.breakStreak = async function() {
  this.currentStreak = 0;
  this.isActive = false;
  this.metadata.pausedAt = new Date();

  return this.save();
};

// Static method to get user's streaks
streakSchema.statics.getUserStreaks = function(userId) {
  return this.find({ userId, isActive: true }).sort({ currentStreak: -1 });
};

// Static method to get leaderboard for streak type
streakSchema.statics.getLeaderboard = function(type, venueId = null, limit = 50) {
  const query = { type, isActive: true };
  if (venueId) query.venueId = venueId;

  return this.find(query)
    .populate('userId', 'displayName avatarUrl')
    .sort({ currentStreak: -1 })
    .limit(limit);
};

// Static method to get at-risk streaks (for notifications)
streakSchema.statics.getAtRiskStreaks = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  return this.find({
    isActive: true,
    currentStreak: { $gt: 0 },
    lastActivityDate: { $gte: twoDaysAgo, $lt: oneDayAgo },
  }).populate('userId', 'displayName pushTokens');
};

// Static method to break expired streaks
streakSchema.statics.breakExpiredStreaks = async function() {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const result = await this.updateMany(
    {
      isActive: true,
      currentStreak: { $gt: 0 },
      lastActivityDate: { $lt: twoDaysAgo },
    },
    {
      currentStreak: 0,
      isActive: false,
      'metadata.pausedAt': new Date(),
    }
  );

  return result.modifiedCount;
};

// Static method to get streak stats
streakSchema.statics.getStats = async function(userId = null, type = null, venueId = null) {
  const query = {};
  if (userId) query.userId = userId;
  if (type) query.type = type;
  if (venueId) query.venueId = venueId;

  const streaks = await this.find(query);

  const stats = {
    totalStreaks: streaks.length,
    activeStreaks: streaks.filter(s => s.isActive).length,
    totalActivities: streaks.reduce((sum, s) => sum + s.totalActivities, 0),
    longestStreak: Math.max(...streaks.map(s => s.longestStreak), 0),
    avgStreak: 0,
    totalMilestones: 0,
    claimedMilestones: 0,
  };

  if (streaks.length > 0) {
    stats.avgStreak = streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length;
  }

  streaks.forEach(streak => {
    stats.totalMilestones += streak.milestones.length;
    stats.claimedMilestones += streak.milestones.filter(m => m.claimed).length;
  });

  return stats;
};

module.exports = mongoose.model('Streak', streakSchema);
