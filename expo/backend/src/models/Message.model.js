const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userBadge: {
      type: String,
      default: 'GUEST',
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: String,
      ref: 'Message',
    },
    reactions: [
      {
        emoji: String,
        userIds: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MessageSchema.index({ channelId: 1, timestamp: -1 });
MessageSchema.index({ userId: 1, timestamp: -1 });

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
