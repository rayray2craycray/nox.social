const mongoose = require('mongoose');
const crypto = require('crypto');

const TicketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketTier',
      required: true,
    },
    qrCode: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'USED', 'TRANSFERRED', 'CANCELLED', 'REFUNDED'],
      default: 'ACTIVE',
      index: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
    },
    transferredTo: {
      type: String,
    },
    transferredAt: {
      type: Date,
    },
    checkInLocation: {
      latitude: Number,
      longitude: Number,
    },
    purchaseDetails: {
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      paymentMethod: {
        type: String,
      },
      transactionId: {
        type: String,
      },
      // Stripe-backed payments. stripePaymentIntentId is the webhook's join key:
      // payment_intent.succeeded → look up by this → mark paymentStatus = 'PAID'.
      stripePaymentIntentId: {
        type: String,
        index: true,
      },
      paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
      },
      paidAt: { type: Date },
      refundedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries. qrCode and status are already indexed inline
// (index: true on their fields), so only the compound index lives here.
TicketSchema.index({ eventId: 1, userId: 1 });

// Generate unique QR code before validation. Must be pre('validate') not
// pre('save') — Mongoose runs validation BEFORE save hooks, so setting a
// required field in pre('save') fails validation first ("qrCode is required").
TicketSchema.pre('validate', function (next) {
  if (this.isNew && !this.qrCode) {
    this.qrCode = generateQRCode();
  }
  next();
});

// Helper function to generate QR code
function generateQRCode() {
  return crypto.randomBytes(32).toString('hex');
}

// Method to check-in ticket
TicketSchema.methods.checkIn = async function (location) {
  if (this.status !== 'ACTIVE') {
    throw new Error('Ticket is not active');
  }

  this.status = 'USED';
  this.usedAt = new Date();
  if (location) {
    this.checkInLocation = location;
  }

  await this.save();
  return this;
};

// Method to transfer ticket
TicketSchema.methods.transfer = async function (newUserId) {
  if (this.status !== 'ACTIVE') {
    throw new Error('Can only transfer active tickets');
  }

  this.transferredTo = newUserId;
  this.transferredAt = new Date();
  this.status = 'TRANSFERRED';

  await this.save();

  // Create new ticket for recipient
  const newTicket = new this.constructor({
    eventId: this.eventId,
    userId: newUserId,
    tierId: this.tierId,
    purchasedAt: new Date(),
    purchaseDetails: {
      amount: 0, // Transferred tickets are free
      currency: this.purchaseDetails.currency,
      paymentMethod: 'TRANSFER',
      transactionId: `TRANSFER-${this._id}`,
    },
  });

  await newTicket.save();
  return newTicket;
};

const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket;
