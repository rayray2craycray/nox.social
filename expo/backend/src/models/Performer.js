/**
 * Performer Model
 * Manages DJs, artists, and performers
 */

const mongoose = require('mongoose');

const performerPostSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['GIG_ANNOUNCEMENT', 'BEHIND_SCENES', 'TRACK_DROP', 'GENERAL'],
    required: true,
  },
  content: {
    text: String,
    imageUrl: String,
    videoUrl: String,
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    trackUrl: String,
    trackName: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const performerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  stageName: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  imageUrl: {
    type: String,
  },
  genres: [{
    type: String,
  }],
  socialMedia: {
    instagram: String,
    spotify: String,
    soundcloud: String,
    tiktok: String,
    twitter: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  followerCount: {
    type: Number,
    default: 0,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  upcomingGigs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],
  pastGigs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],
  posts: [performerPostSchema],
  stats: {
    totalGigs: {
      type: Number,
      default: 0,
    },
    totalAttendees: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  homeCity: String,
  homeVenueId: String,
  tags: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
performerSchema.index({ name: 'text', stageName: 'text' });
performerSchema.index({ genres: 1 });
performerSchema.index({ isVerified: 1, followerCount: -1 });
performerSchema.index({ 'posts.createdAt': -1 });

// Virtual for average rating
performerSchema.virtual('averageRating').get(function() {
  return this.stats.ratingCount > 0
    ? this.stats.rating / this.stats.ratingCount
    : 0;
});

// Method to add follower
performerSchema.methods.addFollower = async function(userId) {
  if (this.followers.includes(userId)) {
    throw new Error('User is already following this performer');
  }

  this.followers.push(userId);
  this.followerCount += 1;

  return this.save();
};

// Method to remove follower
performerSchema.methods.removeFollower = async function(userId) {
  const index = this.followers.indexOf(userId);
  if (index === -1) {
    throw new Error('User is not following this performer');
  }

  this.followers.splice(index, 1);
  this.followerCount -= 1;

  return this.save();
};

// Method to create post
performerSchema.methods.createPost = async function(postData) {
  this.posts.unshift({
    type: postData.type,
    content: postData.content,
    createdAt: new Date(),
  });

  // Keep only last 100 posts
  if (this.posts.length > 100) {
    this.posts = this.posts.slice(0, 100);
  }

  return this.save();
};

// Method to like post
performerSchema.methods.likePost = async function(postId, userId) {
  const post = this.posts.id(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  if (post.likedBy.includes(userId)) {
    throw new Error('Post already liked');
  }

  post.likedBy.push(userId);
  post.likes += 1;

  return this.save();
};

// Method to unlike post
performerSchema.methods.unlikePost = async function(postId, userId) {
  const post = this.posts.id(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const index = post.likedBy.indexOf(userId);
  if (index === -1) {
    throw new Error('Post not liked');
  }

  post.likedBy.splice(index, 1);
  post.likes -= 1;

  return this.save();
};

// Method to add gig
performerSchema.methods.addGig = async function(gigId, isPast = false) {
  if (isPast) {
    if (!this.pastGigs.includes(gigId)) {
      this.pastGigs.push(gigId);
      this.stats.totalGigs += 1;
    }
  } else {
    if (!this.upcomingGigs.includes(gigId)) {
      this.upcomingGigs.push(gigId);
    }
  }

  return this.save();
};

// Method to update rating
performerSchema.methods.addRating = async function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  this.stats.rating += rating;
  this.stats.ratingCount += 1;

  return this.save();
};

// Static method to search performers
performerSchema.statics.searchPerformers = function(searchTerm, limit = 20) {
  return this.find({
    isActive: true,
    $text: { $search: searchTerm },
  })
    .sort({ isVerified: -1, followerCount: -1 })
    .limit(limit);
};

// Static method to get performers by genre
performerSchema.statics.getByGenre = function(genre, limit = 20) {
  return this.find({
    isActive: true,
    genres: genre,
  })
    .sort({ followerCount: -1 })
    .limit(limit);
};

// Static method to get trending performers
performerSchema.statics.getTrending = function(limit = 20) {
  return this.find({
    isActive: true,
  })
    .sort({ followerCount: -1, 'stats.totalGigs': -1 })
    .limit(limit);
};

// Static method to get performer feed for user
performerSchema.statics.getFeedForUser = async function(userId) {
  // Get performers that user follows
  const performers = await this.find({
    followers: userId,
    isActive: true,
  }).select('name stageName imageUrl posts');

  // Aggregate posts from all followed performers
  const feed = [];
  performers.forEach(performer => {
    performer.posts.forEach(post => {
      feed.push({
        ...post.toObject(),
        performerId: performer._id,
        performerName: performer.stageName || performer.name,
        performerImage: performer.imageUrl,
      });
    });
  });

  // Sort by date
  feed.sort((a, b) => b.createdAt - a.createdAt);

  return feed.slice(0, 50); // Return last 50 posts
};

// Static method to move gig from upcoming to past
performerSchema.statics.moveGigToPast = async function(performerId, gigId) {
  const performer = await this.findById(performerId);
  if (!performer) {
    throw new Error('Performer not found');
  }

  // Remove from upcoming
  const upcomingIndex = performer.upcomingGigs.indexOf(gigId);
  if (upcomingIndex > -1) {
    performer.upcomingGigs.splice(upcomingIndex, 1);
  }

  // Add to past
  await performer.addGig(gigId, true);

  return performer;
};

module.exports = mongoose.model('Performer', performerSchema);
