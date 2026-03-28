/**
 * POS Integration Model
 * Stores encrypted API keys and configuration for Toast/Square POS systems
 */

const mongoose = require('mongoose');

const POSIntegrationSchema = new mongoose.Schema({
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
  },

  provider: {
    type: String,
    enum: ['TOAST', 'SQUARE'],
    required: true,
  },

  status: {
    type: String,
    enum: ['DISCONNECTED', 'CONNECTED', 'ERROR', 'VALIDATING'],
    default: 'DISCONNECTED',
  },

  // Encrypted credentials (never return in API responses)
  credentials: {
    apiKey: {
      type: String,
      select: false, // Never include in queries by default
    },
    locationId: String,
    environment: {
      type: String,
      enum: ['PRODUCTION', 'SANDBOX'],
      default: 'PRODUCTION',
    },
  },

  // Provider-specific metadata
  metadata: {
    locationName: String,
    merchantName: String,
    currency: {
      type: String,
      default: 'USD',
    },
    timezone: String,
    webhookUrl: String, // For Square webhooks
  },

  // Sync configuration
  syncConfig: {
    enabled: {
      type: Boolean,
      default: true,
    },
    interval: {
      type: Number,
      default: 300, // 5 minutes in seconds
    },
    lastSyncAt: Date,
    lastSyncStatus: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING'],
    },
    syncErrors: [String],
  },

  // Webhook configuration (Square only)
  webhooks: {
    enabled: Boolean,
    subscriptionId: String,
    secret: {
      type: String,
      select: false, // Never include in queries by default
    },
    events: [String], // ['payment.created', 'order.created']
  },

  // Connection timestamps
  connectedAt: Date,
  disconnectedAt: Date,

  // Validation errors
  lastValidationError: String,
  lastValidatedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
POSIntegrationSchema.index({ venueId: 1 });
POSIntegrationSchema.index({ provider: 1 });
POSIntegrationSchema.index({ status: 1 });
POSIntegrationSchema.index({ venueId: 1, provider: 1 }, { unique: true }); // One integration per venue per provider

// Update timestamp on save
POSIntegrationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if connected
POSIntegrationSchema.virtual('isConnected').get(function () {
  return this.status === 'CONNECTED';
});

// Method to safely get public data (excludes credentials)
POSIntegrationSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    venueId: this.venueId,
    provider: this.provider,
    status: this.status,
    metadata: this.metadata,
    syncConfig: {
      enabled: this.syncConfig.enabled,
      interval: this.syncConfig.interval,
      lastSyncAt: this.syncConfig.lastSyncAt,
      lastSyncStatus: this.syncConfig.lastSyncStatus,
    },
    webhooks: this.webhooks
      ? {
          enabled: this.webhooks.enabled,
          events: this.webhooks.events,
        }
      : null,
    connectedAt: this.connectedAt,
    disconnectedAt: this.disconnectedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('POSIntegration', POSIntegrationSchema);
