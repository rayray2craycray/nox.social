/**
 * Business Profile Model
 * Represents venue owner business registration and verification
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BusinessProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    venueName: {
      type: String,
      required: true,
      trim: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
    },
    businessEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'USA' },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      enum: ['BAR', 'CLUB', 'LOUNGE', 'RESTAURANT', 'OTHER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiry: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
    },
    documentsSubmitted: {
      type: Boolean,
      default: false,
    },
    documentsApproved: {
      type: Boolean,
      default: false,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['BUSINESS_LICENSE', 'TAX_ID', 'PHOTO_ID', 'PROOF_OF_ADDRESS', 'OTHER'],
          required: true,
        },
        documentUrl: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number, // in bytes
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
          default: 'PENDING',
        },
        reviewedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        reviewedAt: {
          type: Date,
        },
        rejectionReason: {
          type: String,
        },
        notes: {
          type: String,
        },
      },
    ],
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BusinessProfileSchema.index({ userId: 1 });
BusinessProfileSchema.index({ businessEmail: 1 }, { unique: true });
BusinessProfileSchema.index({ verificationToken: 1 });
BusinessProfileSchema.index({ venueId: 1 });
BusinessProfileSchema.index({ status: 1 });

module.exports = mongoose.model('BusinessProfile', BusinessProfileSchema);
