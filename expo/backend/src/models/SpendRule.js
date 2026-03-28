/**
 * Spend Rule Model
 * Defines rules for unlocking tiers based on customer spending
 */

const mongoose = require('mongoose');

const SpendRuleSchema = new mongoose.Schema({
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true,
  },

  // Spend threshold to trigger the rule (in cents)
  threshold: {
    type: Number,
    required: true,
    min: 0,
  },

  // What tier to unlock when threshold is met
  tierUnlocked: {
    type: String,
    enum: ['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'],
    required: true,
  },

  // What server access level to grant
  serverAccessLevel: {
    type: String,
    enum: ['PUBLIC_LOBBY', 'INNER_CIRCLE'],
    required: true,
  },

  // Only trigger during live events
  isLiveOnly: {
    type: Boolean,
    default: false,
  },

  // Time window for live-only rules
  liveTimeWindow: {
    startTime: String, // HH:MM format (e.g., "22:00")
    endTime: String, // HH:MM format (e.g., "02:00")
  },

  // Require specific performer to be performing
  performerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Performer',
  },

  // Rule active status
  isActive: {
    type: Boolean,
    default: true,
  },

  // Rule description (optional)
  description: String,

  // Priority (higher = processed first)
  priority: {
    type: Number,
    default: 0,
  },

  // Statistics
  stats: {
    timesTriggered: {
      type: Number,
      default: 0,
    },
    lastTriggeredAt: Date,
    usersUnlocked: {
      type: Number,
      default: 0,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
SpendRuleSchema.index({ venueId: 1, isActive: 1 });
SpendRuleSchema.index({ venueId: 1, threshold: 1 });

// Update timestamp on save
SpendRuleSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for dollar threshold
SpendRuleSchema.virtual('thresholdDollars').get(function () {
  return this.threshold / 100;
});

// Method to check if rule should trigger for a time
SpendRuleSchema.methods.shouldTriggerAtTime = function (timestamp) {
  if (!this.isLiveOnly) {
    return true; // Always trigger if not live-only
  }

  if (!this.liveTimeWindow || !this.liveTimeWindow.startTime || !this.liveTimeWindow.endTime) {
    return false; // No time window defined
  }

  const time = new Date(timestamp);
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const currentTime = hours * 60 + minutes; // Minutes since midnight

  const [startHours, startMinutes] = this.liveTimeWindow.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.liveTimeWindow.endTime.split(':').map(Number);

  const startTime = startHours * 60 + startMinutes;
  let endTime = endHours * 60 + endMinutes;

  // Handle overnight time windows (e.g., 22:00 - 02:00)
  if (endTime < startTime) {
    endTime += 24 * 60; // Add 24 hours
    if (currentTime < startTime) {
      currentTime += 24 * 60; // Current time is after midnight
    }
  }

  return currentTime >= startTime && currentTime <= endTime;
};

// Static method to get active rules for venue
SpendRuleSchema.statics.getActiveRulesForVenue = async function (venueId) {
  return this.find({
    venueId,
    isActive: true,
  }).sort({ priority: -1, threshold: 1 }); // Sort by priority, then threshold
};

// Static method to find applicable rule for user spend
SpendRuleSchema.statics.findApplicableRule = async function (venueId, totalSpend, timestamp) {
  const rules = await this.getActiveRulesForVenue(venueId);

  for (const rule of rules) {
    if (totalSpend >= rule.threshold && rule.shouldTriggerAtTime(timestamp)) {
      return rule;
    }
  }

  return null;
};

module.exports = mongoose.model('SpendRule', SpendRuleSchema);
