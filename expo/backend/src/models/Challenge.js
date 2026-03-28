/**
 * Challenge Model
 * Manages venue challenges and gamification
 */

const mongoose = require('mongoose');

const challengeProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currentProgress: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED', 'CLAIMED'],
    default: 'IN_PROGRESS',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  claimedAt: Date,
});

const challengeSchema = new mongoose.Schema({
  venueId: {
    type: String,
    index: true,
  },
  type: {
    type: String,
    enum: ['VISIT_COUNT', 'SPEND_AMOUNT', 'STREAK', 'SOCIAL', 'SPECIAL'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: {
      type: String,
      enum: ['VISITS', 'SPENDING', 'CONSECUTIVE_WEEKS', 'FRIENDS_INVITED', 'CUSTOM'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    timeframe: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'],
    },
  },
  reward: {
    type: {
      type: String,
      enum: ['DISCOUNT', 'FREE_ITEM', 'VIP_ACCESS', 'BADGE', 'POINTS', 'SKIP_LINE'],
      required: true,
    },
    value: mongoose.Schema.Types.Mixed,
    description: {
      type: String,
      required: true,
    },
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  maxParticipants: {
    type: Number,
  },
  currentParticipants: {
    type: Number,
    default: 0,
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD', 'LEGENDARY'],
    default: 'MEDIUM',
  },
  imageUrl: String,
  participants: [challengeProgressSchema],
}, {
  timestamps: true,
});

// Indexes
challengeSchema.index({ venueId: 1, isActive: 1 });
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ startDate: 1, endDate: 1 });
challengeSchema.index({ 'participants.userId': 1 });

// Method to join challenge
challengeSchema.methods.joinChallenge = async function(userId) {
  // Check if challenge is active
  if (!this.isActive) {
    throw new Error('Challenge is not active');
  }

  // Check if challenge has started
  if (new Date() < this.startDate) {
    throw new Error('Challenge has not started yet');
  }

  // Check if challenge has ended
  if (new Date() > this.endDate) {
    throw new Error('Challenge has ended');
  }

  // Check if user already joined
  const existingParticipant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  if (existingParticipant) {
    throw new Error('Already joined this challenge');
  }

  // Check if challenge is full
  if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) {
    throw new Error('Challenge is full');
  }

  this.participants.push({
    userId,
    currentProgress: 0,
    status: 'IN_PROGRESS',
    startedAt: new Date(),
  });
  this.currentParticipants += 1;

  return this.save();
};

// Method to update progress
challengeSchema.methods.updateProgress = async function(userId, progressIncrement = 1) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
    throw new Error('User is not a participant in this challenge');
  }

  if (participant.status === 'COMPLETED' || participant.status === 'CLAIMED') {
    throw new Error('Challenge already completed');
  }

  participant.currentProgress += progressIncrement;

  // Check if challenge is completed
  if (participant.currentProgress >= this.requirements.target) {
    participant.status = 'COMPLETED';
    participant.completedAt = new Date();
  }

  return this.save();
};

// Method to claim reward
challengeSchema.methods.claimReward = async function(userId) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
    throw new Error('User is not a participant in this challenge');
  }

  if (participant.status !== 'COMPLETED') {
    throw new Error('Challenge must be completed before claiming reward');
  }

  if (participant.status === 'CLAIMED') {
    throw new Error('Reward already claimed');
  }

  participant.status = 'CLAIMED';
  participant.claimedAt = new Date();

  return this.save();
};

// Static method to get active challenges
challengeSchema.statics.getActiveChallenges = function(venueId = null) {
  const now = new Date();
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  if (venueId) {
    query.venueId = venueId;
  }

  return this.find(query).sort({ difficulty: 1, endDate: 1 });
};

// Static method to get user's challenges
challengeSchema.statics.getUserChallenges = function(userId) {
  return this.find({
    'participants.userId': userId,
  }).sort({ 'participants.startedAt': -1 });
};

// Static method to get user's progress
challengeSchema.statics.getUserProgress = async function(userId, challengeId) {
  const challenge = await this.findById(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }

  const participant = challenge.participants.find(
    p => p.userId.toString() === userId.toString()
  );

  if (!participant) {
    return null;
  }

  return {
    challengeId: challenge._id,
    title: challenge.title,
    currentProgress: participant.currentProgress,
    target: challenge.requirements.target,
    status: participant.status,
    progressPercentage: (participant.currentProgress / challenge.requirements.target) * 100,
    reward: challenge.reward,
    completedAt: participant.completedAt,
    claimedAt: participant.claimedAt,
  };
};

// Static method to get venue challenge stats
challengeSchema.statics.getVenueStats = async function(venueId) {
  const challenges = await this.find({ venueId });

  const stats = {
    totalChallenges: challenges.length,
    activeChallenges: challenges.filter(c => c.isActive).length,
    totalParticipants: challenges.reduce((sum, c) => sum + c.currentParticipants, 0),
    completedChallenges: 0,
    rewardsClaimed: 0,
  };

  challenges.forEach(challenge => {
    challenge.participants.forEach(p => {
      if (p.status === 'COMPLETED' || p.status === 'CLAIMED') {
        stats.completedChallenges += 1;
      }
      if (p.status === 'CLAIMED') {
        stats.rewardsClaimed += 1;
      }
    });
  });

  return stats;
};

// Auto-deactivate expired challenges
challengeSchema.statics.deactivateExpired = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      isActive: true,
      endDate: { $lt: now },
    },
    {
      isActive: false,
    }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model('Challenge', challengeSchema);
