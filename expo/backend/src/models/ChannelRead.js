/**
 * ChannelRead
 *
 * Tracks the last time a user read a chat channel, so unread counts are real
 * (messages after lastReadAt, not sent by the user). One row per user+channel.
 */

const mongoose = require('mongoose');

const channelReadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    lastReadAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// One read-marker per user per channel.
channelReadSchema.index({ userId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('ChannelRead', channelReadSchema);
