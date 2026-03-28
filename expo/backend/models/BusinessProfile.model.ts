import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessProfile extends Document {
  userId: mongoose.Types.ObjectId;
  venueName: string;
  venueId?: mongoose.Types.ObjectId;
  businessEmail: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  phone?: string;
  website?: string;
  description?: string;
  businessType: 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT' | 'OTHER';
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  documentsSubmitted: boolean;
  documentsApproved: boolean;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessProfileSchema = new Schema<IBusinessProfile>(
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
          type: [Number],
          validate: {
            validator: function (v: number[]) {
              return v.length === 2;
            },
            message: 'Coordinates must have exactly 2 values [longitude, latitude]',
          },
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

export default mongoose.model<IBusinessProfile>('BusinessProfile', BusinessProfileSchema);
