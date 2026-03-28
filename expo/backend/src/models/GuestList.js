/**
 * Guest List Model
 * Manages venue guest lists for events and regular entry
 */

const mongoose = require('mongoose');

const guestListSchema = new mongoose.Schema({
  venueId: {
    type: String,
    required: true,
    index: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    index: true,
  },
  guestUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  guestName: {
    type: String,
    required: true,
  },
  guestPhone: {
    type: String,
  },
  guestEmail: {
    type: String,
  },
  plusOnes: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listType: {
    type: String,
    enum: ['VIP', 'GENERAL', 'MEDIA', 'INDUSTRY', 'COMP'],
    default: 'GENERAL',
  },
  specialRequests: String,
  tableNumber: String,
  checkedInAt: Date,
  checkedInBy: String,
  notes: String,
}, {
  timestamps: true,
});

// Indexes for efficient queries
guestListSchema.index({ venueId: 1, status: 1 });
guestListSchema.index({ eventId: 1, status: 1 });
guestListSchema.index({ guestUserId: 1, status: 1 });
guestListSchema.index({ venueId: 1, eventId: 1, status: 1 });

// Method to check in guest
guestListSchema.methods.checkIn = async function(checkedInBy) {
  if (this.status === 'CHECKED_IN') {
    throw new Error('Guest already checked in');
  }

  if (this.status === 'CANCELLED') {
    throw new Error('Cannot check in cancelled guest');
  }

  this.status = 'CHECKED_IN';
  this.checkedInAt = new Date();
  this.checkedInBy = checkedInBy;

  return this.save();
};

// Method to cancel guest list entry
guestListSchema.methods.cancel = async function() {
  if (this.status === 'CHECKED_IN') {
    throw new Error('Cannot cancel guest that is already checked in');
  }

  this.status = 'CANCELLED';
  return this.save();
};

// Static method to get venue guest list
guestListSchema.statics.getVenueList = function(venueId, date = null, status = null) {
  const query = { venueId };

  if (status) {
    query.status = status;
  } else {
    // By default, exclude cancelled and no-shows
    query.status = { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] };
  }

  // If date provided, filter for that date's events or no event (walk-ins)
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query.$or = [
      { eventId: null }, // Walk-ins
      { createdAt: { $gte: startOfDay, $lte: endOfDay } }
    ];
  }

  return this.find(query)
    .populate('guestUserId', 'displayName avatarUrl phoneNumber')
    .populate('eventId', 'title date')
    .populate('addedBy', 'displayName')
    .sort({ createdAt: -1 });
};

// Static method to get event guest list
guestListSchema.statics.getEventList = function(eventId, status = null) {
  const query = { eventId };

  if (status) {
    query.status = status;
  } else {
    query.status = { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] };
  }

  return this.find(query)
    .populate('guestUserId', 'displayName avatarUrl phoneNumber')
    .populate('addedBy', 'displayName')
    .sort({ listType: 1, createdAt: -1 });
};

// Static method to get user's guest list entries
guestListSchema.statics.getUserEntries = function(userId) {
  return this.find({
    guestUserId: userId,
    status: { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
  })
    .populate('eventId', 'title date startTime imageUrl')
    .sort({ createdAt: -1 });
};

// Static method to check if user is on guest list
guestListSchema.statics.isUserOnList = async function(userId, venueId, eventId = null) {
  const query = {
    guestUserId: userId,
    venueId,
    status: { $in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
  };

  if (eventId) {
    query.eventId = eventId;
  }

  const entry = await this.findOne(query);
  return !!entry;
};

// Static method to get stats
guestListSchema.statics.getStats = async function(venueId, eventId = null) {
  const query = { venueId };
  if (eventId) query.eventId = eventId;

  const total = await this.countDocuments(query);
  const confirmed = await this.countDocuments({ ...query, status: 'CONFIRMED' });
  const checkedIn = await this.countDocuments({ ...query, status: 'CHECKED_IN' });
  const pending = await this.countDocuments({ ...query, status: 'PENDING' });
  const noShows = await this.countDocuments({ ...query, status: 'NO_SHOW' });

  // Calculate total people including plus ones
  const entries = await this.find(query);
  const totalPeople = entries.reduce((sum, entry) => sum + 1 + entry.plusOnes, 0);
  const checkedInEntries = entries.filter(e => e.status === 'CHECKED_IN');
  const totalCheckedInPeople = checkedInEntries.reduce((sum, entry) => sum + 1 + entry.plusOnes, 0);

  return {
    totalEntries: total,
    totalPeople,
    pending,
    confirmed,
    checkedIn,
    checkedInPeople: totalCheckedInPeople,
    noShows,
    checkInRate: total > 0 ? (checkedIn / total) * 100 : 0,
  };
};

// Auto-mark no-shows for past events
guestListSchema.statics.markNoShows = async function(eventId) {
  const result = await this.updateMany(
    {
      eventId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    {
      status: 'NO_SHOW',
    }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model('GuestList', guestListSchema);
