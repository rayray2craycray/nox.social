const mongoose = require('mongoose');

const FriendshipSchema = new mongoose.Schema(
  {
    requesterId: {
      type: String,
      required: true,
      index: true,
    },
    addresseeId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'],
      default: 'PENDING',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });
FriendshipSchema.index({ requesterId: 1, status: 1 });
FriendshipSchema.index({ addresseeId: 1, status: 1 });

// Prevent duplicate friend requests in reverse direction
FriendshipSchema.pre('save', async function (next) {
  if (this.isNew) {
    const reverseRequest = await this.constructor.findOne({
      requesterId: this.addresseeId,
      addresseeId: this.requesterId,
    });

    if (reverseRequest) {
      const error = new Error('Friend request already exists in reverse direction');
      error.code = 'DUPLICATE_REQUEST';
      return next(error);
    }
  }
  next();
});

const Friendship = mongoose.model('Friendship', FriendshipSchema);

module.exports = Friendship;
