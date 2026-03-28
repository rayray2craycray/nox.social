/**
 * Price Alert Model
 * Manages user alerts for price drops and special deals
 */

const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
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
  targetDiscount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  notificationPreference: {
    type: String,
    enum: ['PUSH', 'SMS', 'EMAIL', 'IN_APP'],
    default: 'PUSH',
  },
  lastNotifiedAt: Date,
  notificationCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  conditions: {
    dayOfWeek: [Number], // Array of days, e.g., [5, 6] for Friday and Saturday
    timeRange: {
      start: String, // HH:mm format
      end: String,
    },
  },
}, {
  timestamps: true,
});

// Indexes
priceAlertSchema.index({ userId: 1, venueId: 1 });
priceAlertSchema.index({ venueId: 1, isActive: 1 });
priceAlertSchema.index({ isActive: 1, expiresAt: 1 });

// Method to check if alert should trigger
priceAlertSchema.methods.shouldTrigger = function(currentPricing) {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;

  // Check if discount meets target
  if (currentPricing.discountPercentage < this.targetDiscount) {
    return false;
  }

  // Check day of week conditions
  if (this.conditions?.dayOfWeek?.length > 0) {
    const currentDay = new Date().getDay();
    if (!this.conditions.dayOfWeek.includes(currentDay)) {
      return false;
    }
  }

  // Check time range conditions
  if (this.conditions?.timeRange) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (currentTime < this.conditions.timeRange.start || currentTime > this.conditions.timeRange.end) {
      return false;
    }
  }

  // Don't notify too frequently (at least 1 hour between notifications)
  if (this.lastNotifiedAt) {
    const hoursSinceLastNotification = (Date.now() - this.lastNotifiedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastNotification < 1) {
      return false;
    }
  }

  return true;
};

// Method to mark as notified
priceAlertSchema.methods.markNotified = async function() {
  this.lastNotifiedAt = new Date();
  this.notificationCount += 1;
  return this.save();
};

// Method to deactivate alert
priceAlertSchema.methods.deactivate = async function() {
  this.isActive = false;
  return this.save();
};

// Static method to get user's alerts
priceAlertSchema.statics.getUserAlerts = function(userId, activeOnly = true) {
  const query = { userId };
  if (activeOnly) {
    query.isActive = true;
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ];
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get alerts for venue
priceAlertSchema.statics.getVenueAlerts = function(venueId) {
  return this.find({
    venueId,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ],
  }).populate('userId', 'displayName phoneNumber email');
};

// Static method to find matching alerts for pricing
priceAlertSchema.statics.findMatchingAlerts = async function(venueId, currentPricing) {
  const alerts = await this.find({
    venueId,
    isActive: true,
    targetDiscount: { $lte: currentPricing.discountPercentage },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ],
  }).populate('userId', 'displayName phoneNumber email pushTokens');

  // Filter alerts that pass additional conditions
  const matchingAlerts = [];
  for (const alert of alerts) {
    if (alert.shouldTrigger(currentPricing)) {
      matchingAlerts.push(alert);
    }
  }

  return matchingAlerts;
};

// Static method to deactivate expired alerts
priceAlertSchema.statics.deactivateExpired = async function() {
  const now = new Date();

  const result = await this.updateMany(
    {
      isActive: true,
      expiresAt: { $lt: now },
    },
    {
      isActive: false,
    }
  );

  return result.modifiedCount;
};

// Static method to get alert stats
priceAlertSchema.statics.getStats = async function(userId = null, venueId = null) {
  const query = {};
  if (userId) query.userId = userId;
  if (venueId) query.venueId = venueId;

  const total = await this.countDocuments(query);
  const active = await this.countDocuments({
    ...query,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ],
  });

  const alerts = await this.find(query);
  const totalNotifications = alerts.reduce((sum, alert) => sum + alert.notificationCount, 0);

  return {
    total,
    active,
    inactive: total - active,
    totalNotifications,
    avgNotificationsPerAlert: total > 0 ? totalNotifications / total : 0,
  };
};

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
