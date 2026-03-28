/**
 * Crew Model
 * Manages user crews/squads for group nightlife activities
 */

const mongoose = require('mongoose');

const crewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  description: {
    type: String,
    maxlength: 200,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  memberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  imageUrl: {
    type: String,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  settings: {
    requireApproval: {
      type: Boolean,
      default: true,
    },
    maxMembers: {
      type: Number,
      default: 20,
      min: 2,
      max: 50,
    },
  },
  stats: {
    totalNightsOut: {
      type: Number,
      default: 0,
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
    favoriteVenueId: String,
    lastActivityDate: Date,
  },
  tags: [String],
}, {
  timestamps: true,
});

// Indexes
crewSchema.index({ ownerId: 1 });
crewSchema.index({ memberIds: 1 });
crewSchema.index({ name: 'text' });

// Virtual for member count
crewSchema.virtual('memberCount').get(function() {
  return this.memberIds.length;
});

// Method to add member
crewSchema.methods.addMember = async function(userId) {
  // Check if user is already a member
  if (this.memberIds.includes(userId)) {
    throw new Error('User is already a member of this crew');
  }

  // Check if crew is full
  if (this.memberIds.length >= this.settings.maxMembers) {
    throw new Error('Crew is full');
  }

  this.memberIds.push(userId);
  return this.save();
};

// Method to remove member
crewSchema.methods.removeMember = async function(userId) {
  // Check if user is the owner
  if (this.ownerId.toString() === userId.toString()) {
    throw new Error('Owner cannot be removed from crew');
  }

  // Check if user is a member
  const index = this.memberIds.indexOf(userId);
  if (index === -1) {
    throw new Error('User is not a member of this crew');
  }

  this.memberIds.splice(index, 1);
  return this.save();
};

// Method to transfer ownership
crewSchema.methods.transferOwnership = async function(newOwnerId) {
  // Check if new owner is a member
  if (!this.memberIds.includes(newOwnerId)) {
    throw new Error('New owner must be a crew member');
  }

  this.ownerId = newOwnerId;
  return this.save();
};

// Method to update stats
crewSchema.methods.updateStats = async function(updates) {
  if (updates.nightOut) {
    this.stats.totalNightsOut += 1;
  }

  if (updates.event) {
    this.stats.totalEvents += 1;
  }

  if (updates.venueId) {
    this.stats.favoriteVenueId = updates.venueId;
  }

  this.stats.lastActivityDate = new Date();
  return this.save();
};

// Static method to get user's crews
crewSchema.statics.getUserCrews = function(userId) {
  return this.find({
    $or: [
      { ownerId: userId },
      { memberIds: userId },
    ],
  })
    .populate('ownerId', 'displayName avatarUrl')
    .populate('memberIds', 'displayName avatarUrl')
    .sort({ 'stats.lastActivityDate': -1, createdAt: -1 });
};

// Static method to search crews
crewSchema.statics.searchCrews = function(searchTerm, limit = 20) {
  return this.find({
    isPrivate: false,
    $text: { $search: searchTerm },
  })
    .populate('ownerId', 'displayName avatarUrl')
    .populate('memberIds', 'displayName avatarUrl')
    .limit(limit);
};

// Static method to get active crews
crewSchema.statics.getActiveCrews = function(limit = 20) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return this.find({
    isPrivate: false,
    'stats.lastActivityDate': { $gte: thirtyDaysAgo },
  })
    .populate('ownerId', 'displayName avatarUrl')
    .populate('memberIds', 'displayName avatarUrl')
    .sort({ 'stats.totalNightsOut': -1 })
    .limit(limit);
};

// Static method to get crew stats
crewSchema.statics.getCrewStats = async function(crewId) {
  const crew = await this.findById(crewId);
  if (!crew) {
    throw new Error('Crew not found');
  }

  return {
    memberCount: crew.memberIds.length,
    totalNightsOut: crew.stats.totalNightsOut,
    totalEvents: crew.stats.totalEvents,
    favoriteVenueId: crew.stats.favoriteVenueId,
    lastActivityDate: crew.stats.lastActivityDate,
    avgNightsPerMember: crew.memberIds.length > 0
      ? crew.stats.totalNightsOut / crew.memberIds.length
      : 0,
  };
};

module.exports = mongoose.model('Crew', crewSchema);
