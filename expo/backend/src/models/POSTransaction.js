/**
 * POS Transaction Model
 * Stores transactions synced from Toast/Square POS systems
 */

const mongoose = require('mongoose');

const POSTransactionSchema = new mongoose.Schema({
  posIntegrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'POSIntegration',
    required: true,
  },

  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true,
  },

  provider: {
    type: String,
    enum: ['TOAST', 'SQUARE'],
    required: true,
  },

  // External IDs from POS system (for deduplication)
  externalIds: {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: String,
    customerId: String,
  },

  // Transaction details
  amount: {
    total: {
      type: Number,
      required: true, // In cents
    },
    subtotal: Number,
    tax: Number,
    tip: Number,
    discount: Number,
  },

  currency: {
    type: String,
    default: 'USD',
  },

  // Payment method
  paymentMethod: {
    type: {
      type: String, // CARD, CASH, MOBILE_PAYMENT, etc.
    },
    cardBrand: String, // VISA, MASTERCARD, AMEX
    lastFour: String, // Last 4 digits
    cardToken: {
      type: String,
      index: true, // For user matching
    },
  },

  // User matching (if card token matches a user)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },

  matchedAt: Date,
  matchConfidence: Number, // 0-100 confidence score

  // Transaction metadata
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'],
    default: 'COMPLETED',
  },

  timestamp: {
    type: Date,
    required: true,
    index: true,
  },

  items: [
    {
      name: String,
      quantity: Number,
      price: Number, // In cents
    },
  ],

  // Rule processing
  rulesProcessed: [
    {
      ruleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpendRule',
      },
      triggered: Boolean,
      tierUnlocked: String,
      accessGranted: String,
      processedAt: Date,
    },
  ],

  // Raw POS data (for debugging)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    select: false, // Don't include by default
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for common queries
POSTransactionSchema.index({ venueId: 1, timestamp: -1 });
POSTransactionSchema.index({ userId: 1, timestamp: -1 });
POSTransactionSchema.index({ provider: 1, 'externalIds.transactionId': 1 }, { unique: true }); // Prevent duplicates

// Method to calculate total revenue
POSTransactionSchema.statics.getVenueRevenue = async function (venueId, period = 'all') {
  const match = {
    venueId: mongoose.Types.ObjectId(venueId),
    status: 'COMPLETED',
  };

  // Add date filter based on period
  if (period !== 'all') {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    match.timestamp = { $gte: startDate };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount.total' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$amount.total' },
      },
    },
  ]);

  return result[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 };
};

// Method to get user's lifetime spend at venue
POSTransactionSchema.statics.getUserLifetimeSpend = async function (userId, venueId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        venueId: mongoose.Types.ObjectId(venueId),
        status: 'COMPLETED',
      },
    },
    {
      $group: {
        _id: null,
        totalSpend: { $sum: '$amount.total' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalSpend: 0, transactionCount: 0 };
};

// Virtual for dollar amount
POSTransactionSchema.virtual('amountDollars').get(function () {
  return this.amount.total / 100;
});

module.exports = mongoose.model('POSTransaction', POSTransactionSchema);
