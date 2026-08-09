/**
 * CheckIn Model
 *
 * One document per location-verified check-in. The user's badge (visitCount /
 * lastVisitAt) is the aggregate; this collection is the timestamped LOG that
 * makes venue analytics possible — check-ins tonight, peak hours, day-by-day
 * trend, new-vs-returning, unique visitors. Without it we only know a user's
 * most recent visit, not the history.
 *
 * venueId is stored as a string to match how check-ins/badges/events are keyed
 * app-side (usually a Google Place ID, sometimes a Mongo Venue _id string).
 */

const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    venueId: { type: String, required: true, index: true },
    venueName: { type: String },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Tier the user held AFTER this check-in, and which visit number it was.
    // Snapshotted so analytics never has to re-derive history from the user.
    tier: {
      type: String,
      enum: ['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'],
      default: 'GUEST',
    },
    visitNumber: { type: Number, default: 1 },
    isFirstVisit: { type: Boolean, default: false },

    // Optional coordinates at check-in time (for future heatmaps).
    lat: { type: Number },
    lng: { type: Number },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

// Primary analytics access pattern: everything for one venue, newest first.
checkInSchema.index({ venueId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
