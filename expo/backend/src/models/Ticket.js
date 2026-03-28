/**
 * Ticket Model
 * Manages event tickets and QR codes for entry
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tierId: {
    type: String,
    required: true,
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'USED', 'TRANSFERRED', 'CANCELLED'],
    default: 'ACTIVE',
    index: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
  usedAt: Date,
  transferredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  transferredAt: Date,
  checkedInBy: String,
}, {
  timestamps: true,
});

// Indexes
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ eventId: 1, status: 1 });

// Generate unique QR code
ticketSchema.statics.generateQRCode = async function(eventId, userId) {
  let qrCode;
  let exists = true;

  while (exists) {
    const data = `${eventId}-${userId}-${Date.now()}-${Math.random()}`;
    qrCode = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
    exists = await this.findOne({ qrCode });
  }

  return qrCode;
};

// Method to validate QR code
ticketSchema.statics.validateQRCode = async function(qrCode) {
  const ticket = await this.findOne({ qrCode })
    .populate('eventId')
    .populate('userId', 'displayName avatarUrl');

  if (!ticket) {
    return { valid: false, error: 'Invalid QR code' };
  }

  if (ticket.status === 'USED') {
    return { valid: false, error: 'Ticket already used', ticket };
  }

  if (ticket.status !== 'ACTIVE') {
    return { valid: false, error: 'Ticket is not active', ticket };
  }

  // Check if event is today
  const eventDate = new Date(ticket.eventId.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate.getTime() !== today.getTime()) {
    return { valid: false, error: 'Ticket is not valid for today', ticket };
  }

  return { valid: true, ticket };
};

// Method to check in (mark ticket as used)
ticketSchema.methods.checkIn = async function(checkedInBy) {
  if (this.status !== 'ACTIVE') {
    throw new Error('Ticket cannot be used');
  }

  this.status = 'USED';
  this.usedAt = new Date();
  this.checkedInBy = checkedInBy;

  return this.save();
};

// Method to transfer ticket
ticketSchema.methods.transferTo = async function(newUserId) {
  if (this.status !== 'ACTIVE') {
    throw new Error('Only active tickets can be transferred');
  }

  // Check if event hasn't started
  const event = await mongoose.model('Event').findById(this.eventId);
  if (new Date(event.date) < new Date()) {
    throw new Error('Cannot transfer tickets for past events');
  }

  this.transferredTo = newUserId;
  this.transferredAt = new Date();
  this.status = 'TRANSFERRED';

  await this.save();

  // Create new ticket for recipient
  const newTicket = await this.constructor.create({
    eventId: this.eventId,
    userId: newUserId,
    tierId: this.tierId,
    qrCode: await this.constructor.generateQRCode(this.eventId, newUserId),
    status: 'ACTIVE',
    purchasePrice: this.purchasePrice,
  });

  return newTicket;
};

// Get user's tickets
ticketSchema.statics.getUserTickets = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;

  return this.find(query)
    .populate('eventId')
    .sort({ purchasedAt: -1 });
};

// Get event attendance
ticketSchema.statics.getEventAttendance = async function(eventId) {
  const total = await this.countDocuments({ eventId });
  const used = await this.countDocuments({ eventId, status: 'USED' });
  const active = await this.countDocuments({ eventId, status: 'ACTIVE' });

  return {
    total,
    used,
    active,
    attendanceRate: total > 0 ? (used / total) * 100 : 0,
  };
};

module.exports = mongoose.model('Ticket', ticketSchema);
