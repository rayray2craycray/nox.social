const mongoose = require('mongoose');

const ChallengeProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    currentProgress: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    claimedAt: {
      type: Date,
    },
    progressHistory: [
      {
        amount: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ChallengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
ChallengeProgressSchema.index({ userId: 1, status: 1 });
ChallengeProgressSchema.index({ challengeId: 1, status: 1 });

// Auto-update status when progress reaches target
ChallengeProgressSchema.methods.updateProgress = async function (amount, note) {
  this.currentProgress += amount;
  this.progressHistory.push({ amount, note, timestamp: new Date() });

  // Get challenge to check if completed
  const Challenge = mongoose.model('Challenge');
  const challenge = await Challenge.findById(this.challengeId);

  if (challenge && this.currentProgress >= challenge.requirements.target) {
    this.status = 'COMPLETED';
    this.completedAt = new Date();

    // Update challenge completion count
    await Challenge.findByIdAndUpdate(this.challengeId, {
      $inc: { completionCount: 1 },
    });
  }

  await this.save();
  return this;
};

const ChallengeProgress = mongoose.model('ChallengeProgress', ChallengeProgressSchema);

module.exports = ChallengeProgress;
