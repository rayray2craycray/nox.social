const mongoose = require('mongoose');

const GuestListSchema = new mongoose.Schema(
  {
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
      type: String,
      index: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
    },
    guestPhone: {
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
      type: String,
      required: true,
    },
    addedByName: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: String,
    },
    vipStatus: {
      type: Boolean,
      default: false,
    },
    table: {
      number: String,
      section: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
GuestListSchema.index({ venueId: 1, eventId: 1 });
GuestListSchema.index({ venueId: 1, status: 1 });
GuestListSchema.index({ guestUserId: 1, venueId: 1 });

// Method to check in guest
GuestListSchema.methods.checkIn = async function (checkedInBy) {
  if (this.status === 'CHECKED_IN') {
    throw new Error('Guest already checked in');
  }

  if (this.status === 'CANCELLED') {
    throw new Error('Guest list entry was cancelled');
  }

  this.status = 'CHECKED_IN';
  this.checkedInAt = new Date();
  this.checkedInBy = checkedInBy;

  await this.save();
  return this;
};

// Method to confirm guest
GuestListSchema.methods.confirm = async function () {
  if (this.status !== 'PENDING') {
    throw new Error('Can only confirm pending entries');
  }

  this.status = 'CONFIRMED';
  await this.save();
  return this;
};

// Method to mark as no-show
GuestListSchema.methods.markNoShow = async function () {
  if (this.status !== 'CONFIRMED') {
    throw new Error('Can only mark confirmed guests as no-show');
  }

  // Check if event time has passed
  if (this.eventId) {
    const Event = mongoose.model('Event');
    const event = await Event.findById(this.eventId);
    if (event && new Date(event.date) > new Date()) {
      throw new Error('Cannot mark as no-show before event time');
    }
  }

  this.status = 'NO_SHOW';
  await this.save();
  return this;
};

const GuestList = mongoose.model('GuestList', GuestListSchema);

module.exports = GuestList;
