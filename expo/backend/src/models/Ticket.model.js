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
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TicketSchema.index({ eventId: 1, userId: 1 });
TicketSchema.index({ qrCode: 1 });
TicketSchema.index({ status: 1 });

// Generate unique QR code before saving
TicketSchema.pre('save', function (next) {
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
