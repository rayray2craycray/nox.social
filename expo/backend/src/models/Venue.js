/**
 * Venue Model
 * Represents nightlife venues (bars, clubs, lounges, restaurants)
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VenueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['BAR', 'CLUB', 'LOUNGE', 'RESTAURANT'],
      required: true,
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'USA',
      },
      // GeoJSON for geospatial queries
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    priceLevel: {
      type: Number,
      min: 1,
      max: 4,
      default: 2,
    },
    hours: {
      monday: { type: String, default: '6:00 PM - 2:00 AM' },
      tuesday: { type: String, default: '6:00 PM - 2:00 AM' },
      wednesday: { type: String, default: '6:00 PM - 2:00 AM' },
      thursday: { type: String, default: '6:00 PM - 2:00 AM' },
      friday: { type: String, default: '6:00 PM - 4:00 AM' },
      saturday: { type: String, default: '6:00 PM - 4:00 AM' },
      sunday: { type: String, default: '6:00 PM - 2:00 AM' },
    },
    imageUrl: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    genres: {
      type: [String],
      default: [],
    },
    capacity: {
      type: Number,
      default: 200,
    },
    features: {
      type: [String],
      default: [],
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    currentVibeLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    coverCharge: {
      type: Number,
      default: 0,
    },
    hasPublicLobby: {
      type: Boolean,
      default: true,
    },
    vipThreshold: {
      type: Number,
      default: 90,
    },
    // Google Places data
    googlePlaceId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
    },
    googleRating: {
      type: Number,
    },
    googleTotalRatings: {
      type: Number,
    },
    googlePhotoReferences: {
      type: [String],
      default: [],
    },
    // Business profile link
    businessProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessProfile',
    },
    // Status
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
VenueSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index
VenueSchema.index({ name: 'text' }); // Text search index
VenueSchema.index({ type: 1 });
VenueSchema.index({ googlePlaceId: 1 });
VenueSchema.index({ businessProfileId: 1 });
VenueSchema.index({ status: 1 });

// Set coordinates from latitude/longitude before save
VenueSchema.pre('save', function (next) {
  if (
    this.location &&
    this.location.latitude !== undefined &&
    this.location.longitude !== undefined
  ) {
    // Only set coordinates if they're not 0,0 (missing coordinates)
    if (
      (this.location.latitude !== 0 || this.location.longitude !== 0) &&
      !this.location.coordinates
    ) {
      this.location.coordinates = {
        type: 'Point',
        coordinates: [this.location.longitude, this.location.latitude],
      };
    }
  }
  next();
});

module.exports = mongoose.model('Venue', VenueSchema);
