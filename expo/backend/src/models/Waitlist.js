/**
 * Waitlist Model
 *
 * Pre-launch early-access signups from the nox.social waitlist page. One doc
 * per email (deduped). `city` powers the beachhead go-to-market ("early access
 * in [city]"); `source` tags where the signup came from for attribution.
 */

const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    city: { type: String, trim: true, default: null },
    source: { type: String, default: 'waitlist' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Waitlist', waitlistSchema);
