/**
 * Dynamic Pricing Model
 * Manages time-based and demand-based pricing for venues
 */

const mongoose = require('mongoose');

const dynamicPricingSchema = new mongoose.Schema({
  venueId: {
    type: String,
    required: true,
    index: true,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  surchargePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 200,
  },
  reason: {
    type: String,
    enum: ['SLOW_HOUR', 'EARLY_BIRD', 'APP_EXCLUSIVE', 'HIGH_DEMAND', 'PEAK_HOUR', 'SPECIAL_EVENT', 'DEFAULT'],
    default: 'DEFAULT',
  },
  validUntil: {
    type: Date,
    required: true,
    index: true,
  },
  dayOfWeek: {
    type: Number, // 0 = Sunday, 6 = Saturday
    min: 0,
    max: 6,
  },
  timeSlot: {
    start: String, // HH:mm format
    end: String,   // HH:mm format
  },
  occupancyPercentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  metadata: {
    appliedCount: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
dynamicPricingSchema.index({ venueId: 1, isActive: 1, validUntil: 1 });
dynamicPricingSchema.index({ dayOfWeek: 1, isActive: 1 });
dynamicPricingSchema.index({ createdAt: -1 });

// Virtual for effective price (base price with discount/surcharge)
dynamicPricingSchema.virtual('effectiveDiscount').get(function() {
  return this.discountPercentage - this.surchargePercentage;
});

// Method to calculate price based on conditions
dynamicPricingSchema.statics.calculatePrice = function(basePrice, conditions = {}) {
  const {
    occupancyPercentage = 50,
    dayOfWeek = new Date().getDay(),
    hour = new Date().getHours(),
    isAppExclusive = false,
  } = conditions;

  let finalPrice = basePrice;
  let discountPercentage = 0;
  let surchargePercentage = 0;
  let reason = 'DEFAULT';

  // Weekend surcharge (Friday, Saturday)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    surchargePercentage += 20;
    reason = 'PEAK_HOUR';
  }

  // Peak hour surcharge (10 PM - 2 AM)
  if (hour >= 22 || hour <= 2) {
    surchargePercentage += 15;
    reason = 'PEAK_HOUR';
  }

  // High demand surcharge (occupancy > 80%)
  if (occupancyPercentage > 80) {
    surchargePercentage += 25;
    reason = 'HIGH_DEMAND';
  }

  // Slow hour discount (occupancy < 30%)
  if (occupancyPercentage < 30 && hour >= 6 && hour < 22) {
    discountPercentage = 30;
    reason = 'SLOW_HOUR';
  }

  // Early bird discount (before 9 PM)
  if (hour < 21 && occupancyPercentage < 50) {
    discountPercentage = Math.max(discountPercentage, 20);
    reason = 'EARLY_BIRD';
  }

  // App exclusive discount
  if (isAppExclusive) {
    discountPercentage += 10;
    reason = 'APP_EXCLUSIVE';
  }

  // Calculate final price
  const netAdjustment = surchargePercentage - discountPercentage;
  finalPrice = basePrice * (1 + netAdjustment / 100);

  return {
    currentPrice: Math.max(finalPrice, basePrice * 0.5), // Never go below 50% of base price
    discountPercentage,
    surchargePercentage,
    reason,
  };
};

// Static method to get current pricing for venue
dynamicPricingSchema.statics.getCurrentPricing = async function(venueId) {
  const now = new Date();

  // Find active pricing that hasn't expired
  const pricing = await this.findOne({
    venueId,
    isActive: true,
    validUntil: { $gt: now },
  }).sort({ createdAt: -1 });

  return pricing;
};

// Static method to create or update pricing
dynamicPricingSchema.statics.updatePricing = async function(venueId, basePrice, conditions = {}) {
  const calculated = this.calculatePrice(basePrice, conditions);

  // Expire old pricing
  await this.updateMany(
    { venueId, isActive: true },
    { isActive: false }
  );

  // Create new pricing valid for 1 hour
  const validUntil = new Date(Date.now() + 60 * 60 * 1000);

  const pricing = await this.create({
    venueId,
    basePrice,
    ...calculated,
    validUntil,
    dayOfWeek: conditions.dayOfWeek || new Date().getDay(),
    occupancyPercentage: conditions.occupancyPercentage,
    isActive: true,
  });

  return pricing;
};

// Static method to get pricing history
dynamicPricingSchema.statics.getPricingHistory = function(venueId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    venueId,
    createdAt: { $gte: startDate },
  }).sort({ createdAt: -1 });
};

// Static method to get pricing stats
dynamicPricingSchema.statics.getPricingStats = async function(venueId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const pricings = await this.find({
    venueId,
    createdAt: { $gte: startDate },
  });

  const stats = {
    totalApplications: pricings.reduce((sum, p) => sum + p.metadata.appliedCount, 0),
    totalRevenue: pricings.reduce((sum, p) => sum + p.metadata.totalRevenue, 0),
    avgDiscountPercentage: 0,
    avgSurchargePercentage: 0,
    discountCount: 0,
    surchargeCount: 0,
    reasonBreakdown: {},
  };

  pricings.forEach(pricing => {
    if (pricing.discountPercentage > 0) {
      stats.avgDiscountPercentage += pricing.discountPercentage;
      stats.discountCount += 1;
    }
    if (pricing.surchargePercentage > 0) {
      stats.avgSurchargePercentage += pricing.surchargePercentage;
      stats.surchargeCount += 1;
    }

    if (!stats.reasonBreakdown[pricing.reason]) {
      stats.reasonBreakdown[pricing.reason] = 0;
    }
    stats.reasonBreakdown[pricing.reason] += 1;
  });

  if (stats.discountCount > 0) {
    stats.avgDiscountPercentage /= stats.discountCount;
  }
  if (stats.surchargeCount > 0) {
    stats.avgSurchargePercentage /= stats.surchargeCount;
  }

  return stats;
};

// Method to track application of pricing
dynamicPricingSchema.methods.trackApplication = async function(pricePaid) {
  this.metadata.appliedCount += 1;
  this.metadata.totalRevenue += pricePaid;
  return this.save();
};

// Auto-deactivate expired pricing
dynamicPricingSchema.statics.deactivateExpired = async function() {
  const now = new Date();

  const result = await this.updateMany(
    {
      isActive: true,
      validUntil: { $lt: now },
    },
    {
      isActive: false,
    }
  );

  return result.modifiedCount;
};

module.exports = mongoose.model('DynamicPricing', dynamicPricingSchema);
