/**
 * Event Model
 * Manages venue events with ticket tiers
 */

const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
    enum: ['EARLY_BIRD', 'GENERAL', 'VIP'],
    required: true,
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
  benefits: [String],
});

const eventSchema = new mongoose.Schema({
  venueId: {
    type: String,
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
  performerIds: [{
    type: String,
  }],
  date: {
    type: Date,
    required: true,
    index: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  ticketTiers: [ticketTierSchema],
  imageUrl: {
    type: String,
  },
  genres: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'UPCOMING',
    index: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  attendees: {
    type: Number,
    default: 0,
  },
  ageRestriction: {
    type: Number,
    default: 21,
  },
  tags: [String],
}, {
  timestamps: true,
});

// Indexes
eventSchema.index({ venueId: 1, date: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ performerIds: 1 });

// Virtual for tickets sold
eventSchema.virtual('ticketsSold').get(function() {
  return this.ticketTiers.reduce((sum, tier) => sum + tier.sold, 0);
});

// Virtual for tickets available
eventSchema.virtual('ticketsAvailable').get(function() {
  return this.ticketTiers.reduce((sum, tier) => sum + (tier.quantity - tier.sold), 0);
});

// Method to check ticket availability
eventSchema.methods.hasAvailableTickets = function(tierId) {
  const tier = this.ticketTiers.id(tierId);
  if (!tier) return false;

  const now = new Date();
  if (now < tier.salesWindow.start || now > tier.salesWindow.end) return false;

  return tier.sold < tier.quantity;
};

// Method to sell ticket
eventSchema.methods.sellTicket = async function(tierId) {
  const tier = this.ticketTiers.id(tierId);
  if (!tier) {
    throw new Error('Ticket tier not found');
  }

  if (!this.hasAvailableTickets(tierId)) {
    throw new Error('No tickets available');
  }

  tier.sold += 1;
  this.attendees += 1;

  return this.save();
};

// Static method to get upcoming events
eventSchema.statics.getUpcoming = function(limit = 50) {
  return this.find({
    status: 'UPCOMING',
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .limit(limit);
};

// Static method to get events by venue
eventSchema.statics.getByVenue = function(venueId) {
  return this.find({
    venueId,
    status: { $in: ['UPCOMING', 'ONGOING'] },
  })
    .sort({ date: 1 });
};

// Static method to get events by performer
eventSchema.statics.getByPerformer = function(performerId) {
  return this.find({
    performerIds: performerId,
    status: 'UPCOMING',
    date: { $gte: new Date() },
  })
    .sort({ date: 1 });
};

module.exports = mongoose.model('Event', eventSchema);
