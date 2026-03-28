/**
 * User Model
 * Stores user information including hashed phone numbers, Instagram connections, and email/password authentication
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Email/Password Authentication
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow null for users who only use Instagram
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },

  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't return password by default
  },

  // Basic user info
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Display name must be at least 2 characters'],
    maxlength: [50, 'Display name cannot exceed 50 characters'],
  },

  avatarUrl: {
    type: String,
    default: null,
  },

  profileImageUrl: {
    type: String,
    default: null,
  },

  bio: {
    type: String,
    maxlength: 200,
    default: null,
  },

  dateOfBirth: {
    type: Date,
    default: null,
  },

  // Contact sync - hashed phone number for privacy
  phoneHash: {
    type: String,
    unique: true,
    sparse: true, // Allow null values
    index: true, // Index for fast lookups
  },

  // Original phone for display (optional, can be removed for privacy)
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Instagram integration
  instagramId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },

  instagramUsername: {
    type: String,
    unique: true,
    sparse: true,
  },

  instagramAccessToken: {
    type: String,
    default: null,
    select: false, // Don't include in queries by default (security)
  },

  instagramTokenExpires: {
    type: Date,
    default: null,
  },

  // Social features
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Privacy settings
  isIncognito: {
    type: Boolean,
    default: false,
  },

  // Role and permissions
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
    default: 'USER',
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  lastLoginAt: {
    type: Date,
    default: null,
  },

  lastSyncedContacts: {
    type: Date,
    default: null,
  },

  lastSyncedInstagram: {
    type: Date,
    default: null,
  },
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneHash: 1 });
userSchema.index({ instagramId: 1 });
userSchema.index({ instagramUsername: 1 });
userSchema.index({ displayName: 'text' });

// Hash password before saving and update timestamp
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date();

  // Only hash password if it's been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id.toString(),
    displayName: this.displayName,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    instagramUsername: this.instagramUsername,
    isIncognito: this.isIncognito,
  };
};

userSchema.methods.hasValidInstagramToken = function() {
  if (!this.instagramAccessToken || !this.instagramTokenExpires) {
    return false;
  }

  // Check if token expires in more than 1 day
  const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.instagramTokenExpires > oneDayFromNow;
};

// Method to compare password for authentication
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Static methods
userSchema.statics.findByPhoneHash = function(phoneHash) {
  return this.findOne({ phoneHash });
};

userSchema.statics.findByInstagramId = function(instagramId) {
  return this.findOne({ instagramId });
};

userSchema.statics.findByPhoneHashes = function(phoneHashes) {
  return this.find({ phoneHash: { $in: phoneHashes } });
};

userSchema.statics.searchUsers = function(query, limit = 20) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
