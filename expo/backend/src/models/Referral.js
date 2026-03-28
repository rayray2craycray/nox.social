/**
 * Referral Model
 * Manages user referrals and rewards
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  refereeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'REWARDED'],
    default: 'PENDING',
    index: true,
  },
  rewardType: {
    type: String,
    enum: ['DISCOUNT', 'SKIP_LINE', 'FREE_DRINK', 'VIP_ACCESS'],
  },
  rewardValue: {
    type: Number,
    default: 0,
  },
  rewardDescription: String,
  usedAt: Date,
  rewardedAt: Date,
}, {
  timestamps: true,
});

// Generate unique referral code
referralSchema.statics.generateCode = async function() {
  let code;
  let exists = true;

  while (exists) {
    // Generate 6-character alphanumeric code
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    exists = await this.findOne({ referralCode: code });
  }

  return code;
};

// Create referral for user
referralSchema.statics.createForUser = async function(userId) {
  const code = await this.generateCode();

  return this.create({
    referrerId: userId,
    referralCode: code,
    status: 'PENDING',
  });
};

// Apply referral code
referralSchema.statics.applyCode = async function(code, refereeId) {
  const referral = await this.findOne({
    referralCode: code.toUpperCase(),
    status: 'PENDING',
  });

  if (!referral) {
    throw new Error('Invalid or already used referral code');
  }

  // Can't refer yourself
  if (referral.referrerId.toString() === refereeId.toString()) {
    throw new Error('Cannot use your own referral code');
  }

  // Check if user already used a referral
  const existingReferral = await this.findOne({ refereeId });
  if (existingReferral) {
    throw new Error('You have already used a referral code');
  }

  // Update referral
  referral.refereeId = refereeId;
  referral.status = 'COMPLETED';
  referral.usedAt = new Date();

  // Assign reward
  referral.rewardType = 'DISCOUNT';
  referral.rewardValue = 20; // 20% discount
  referral.rewardDescription = '20% off your first ticket purchase';

  await referral.save();

  // Create reward for referrer too
  await this.create({
    referrerId: referral.referrerId,
    referralCode: await this.generateCode(),
    status: 'REWARDED',
    rewardType: 'DISCOUNT',
    rewardValue: 15,
    rewardDescription: 'Thank you for referring a friend! 15% off',
    rewardedAt: new Date(),
  });

  return referral;
};

// Get user's referral stats
referralSchema.statics.getUserStats = async function(userId) {
  const referrals = await this.find({ referrerId: userId });

  return {
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === 'PENDING').length,
    completedReferrals: referrals.filter(r => r.status === 'COMPLETED' || r.status === 'REWARDED').length,
    totalRewardsEarned: referrals
      .filter(r => r.status === 'REWARDED')
      .reduce((sum, r) => sum + (r.rewardValue || 0), 0),
  };
};

// Get active referral code for user
referralSchema.statics.getUserReferralCode = async function(userId) {
  let referral = await this.findOne({
    referrerId: userId,
    status: 'PENDING',
  });

  if (!referral) {
    referral = await this.createForUser(userId);
  }

  return referral.referralCode;
};

module.exports = mongoose.model('Referral', referralSchema);
