const mongoose = require('mongoose');

const TicketTierSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['EARLY_BIRD', 'GENERAL', 'VIP', 'SPECIAL'],
      default: 'GENERAL',
    },
    salesWindow: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    isAppExclusive: {
      type: Boolean,
      default: false,
    },
    benefits: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TicketTierSchema.index({ eventId: 1, tier: 1 });

// Virtual for checking if available
TicketTierSchema.virtual('isAvailable').get(function () {
  const now = new Date();
  const inSalesWindow = now >= this.salesWindow.start && now <= this.salesWindow.end;
  const hasStock = this.sold < this.quantity;
  return inSalesWindow && hasStock;
});

// Virtual for remaining tickets
TicketTierSchema.virtual('remaining').get(function () {
  return this.quantity - this.sold;
});

const TicketTier = mongoose.model('TicketTier', TicketTierSchema);

module.exports = TicketTier;
