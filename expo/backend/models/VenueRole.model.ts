import mongoose, { Schema, Document } from 'mongoose';

export type VenueRoleType = 'HEAD_MODERATOR' | 'MODERATOR' | 'STAFF' | 'VIEWER';

export type VenuePermission =
  | 'EDIT_VENUE_INFO'
  | 'EDIT_VENUE_DISPLAY'
  | 'MANAGE_EVENTS'
  | 'MANAGE_GUEST_LIST'
  | 'MANAGE_TICKETS'
  | 'MANAGE_PRICING'
  | 'MANAGE_STAFF'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_CONTENT'
  | 'MANAGE_CHALLENGES'
  | 'FULL_ACCESS';

export interface IVenueRole extends Document {
  venueId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: VenueRoleType;
  permissions: VenuePermission[];
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VenueRoleSchema = new Schema<IVenueRole>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['HEAD_MODERATOR', 'MODERATOR', 'STAFF', 'VIEWER'],
      required: true,
    },
    permissions: {
      type: [String],
      enum: [
        'EDIT_VENUE_INFO',
        'EDIT_VENUE_DISPLAY',
        'MANAGE_EVENTS',
        'MANAGE_GUEST_LIST',
        'MANAGE_TICKETS',
        'MANAGE_PRICING',
        'MANAGE_STAFF',
        'VIEW_ANALYTICS',
        'MANAGE_CONTENT',
        'MANAGE_CHALLENGES',
        'FULL_ACCESS',
      ],
      default: [],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one role per user per venue
VenueRoleSchema.index({ venueId: 1, userId: 1 }, { unique: true });
VenueRoleSchema.index({ userId: 1 });
VenueRoleSchema.index({ venueId: 1, isActive: 1 });

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<VenueRoleType, VenuePermission[]> = {
  HEAD_MODERATOR: ['FULL_ACCESS'],
  MODERATOR: [
    'EDIT_VENUE_DISPLAY',
    'MANAGE_EVENTS',
    'MANAGE_GUEST_LIST',
    'MANAGE_CONTENT',
    'VIEW_ANALYTICS',
  ],
  STAFF: ['MANAGE_GUEST_LIST', 'VIEW_ANALYTICS'],
  VIEWER: ['VIEW_ANALYTICS'],
};

export default mongoose.model<IVenueRole>('VenueRole', VenueRoleSchema);
