const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    venueId: {
      type: String,
      required: true,
      index: true,
    },
    venueName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    performerIds: {
      type: [String],
      default: [],
    },
    performerNames: {
      type: [String],
      default: [],
    },
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
    },
    imageUrl: {
      type: String,
    },
    genres: {
      type: [String],
      default: [],
    },
    ageRestriction: {
      type: Number,
      default: 21,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'PUBLISHED',
      index: true,
    },
    capacity: {
      type: Number,
    },
    ticketsSold: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EventSchema.index({ venueId: 1, date: 1 });
EventSchema.index({ date: 1, status: 1 });
EventSchema.index({ status: 1, date: 1 });

// Virtual for checking if event is upcoming
EventSchema.virtual('isUpcoming').get(function () {
  return new Date(this.date) > new Date();
});

// Virtual for checking if event is past
EventSchema.virtual('isPast').get(function () {
  return new Date(this.date) < new Date();
});

// Virtual for checking if sold out
EventSchema.virtual('isSoldOut').get(function () {
  return this.capacity && this.ticketsSold >= this.capacity;
});

const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
