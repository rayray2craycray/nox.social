/**
 * Group Purchase Model
 * Manages split ticket purchases among multiple users
 */

const mongoose = require('mongoose');

const groupPurchaseSchema = new mongoose.Schema({
  initiatorId: {
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
    type: String,
    index: true,
  },
  ticketType: {
    type: String,
    enum: ['ENTRY', 'TABLE', 'BOTTLE_SERVICE'],
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  perPersonAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 20,
  },
  currentParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['OPEN', 'FULL', 'COMPLETED', 'CANCELLED'],
    default: 'OPEN',
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
}, {
  timestamps: true,
});

// Index for efficient queries
groupPurchaseSchema.index({ status: 1, expiresAt: 1 });
groupPurchaseSchema.index({ venueId: 1, status: 1 });

// Virtual for spots remaining
groupPurchaseSchema.virtual('spotsRemaining').get(function() {
  return this.maxParticipants - this.currentParticipants.length;
});

// Method to check if user can join
groupPurchaseSchema.methods.canUserJoin = function(userId) {
  if (this.status !== 'OPEN') return false;
  if (this.currentParticipants.length >= this.maxParticipants) return false;
  if (this.expiresAt < new Date()) return false;
  if (this.currentParticipants.includes(userId)) return false;
  return true;
};

// Method to add participant
groupPurchaseSchema.methods.addParticipant = async function(userId) {
  if (!this.canUserJoin(userId)) {
    throw new Error('Cannot join this group purchase');
  }

  this.currentParticipants.push(userId);

  // Update status if full
  if (this.currentParticipants.length >= this.maxParticipants) {
    this.status = 'FULL';
  }

  return this.save();
};

// Static method to get open purchases for venue
groupPurchaseSchema.statics.getOpenForVenue = function(venueId) {
  return this.find({
    venueId,
    status: 'OPEN',
    expiresAt: { $gt: new Date() },
  })
    .populate('initiatorId', 'displayName avatarUrl')
    .populate('currentParticipants', 'displayName avatarUrl')
    .sort({ createdAt: -1 });
};

// Auto-expire old purchases
groupPurchaseSchema.statics.expireOldPurchases = async function() {
  const result = await this.updateMany(
    {
      status: 'OPEN',
      expiresAt: { $lt: new Date() },
    },
    {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Expired',
    }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model('GroupPurchase', groupPurchaseSchema);
