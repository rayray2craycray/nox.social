const Ticket = require('../models/Ticket.model');
const TicketTier = require('../models/TicketTier.model');
const Event = require('../models/Event.model');

/**
 * Purchase ticket
 * POST /api/tickets/purchase
 */
exports.purchaseTicket = async (req, res) => {
  try {
    const { eventId, tierId, paymentMethod, transactionId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!eventId || !tierId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and Tier ID are required',
      });
    }

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    if (event.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: 'Event is not available for ticket purchase',
      });
    }

    // Get ticket tier
    const tier = await TicketTier.findById(tierId);
    if (!tier) {
      return res.status(404).json({
        success: false,
        error: 'Ticket tier not found',
      });
    }

    // Check if tier belongs to event
    if (tier.eventId.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        error: 'Ticket tier does not belong to this event',
      });
    }

    // Check availability
    if (tier.sold >= tier.quantity) {
      return res.status(400).json({
        success: false,
        error: 'Ticket tier is sold out',
      });
    }

    // Check sales window
    const now = new Date();
    if (now < tier.salesWindow.start || now > tier.salesWindow.end) {
      return res.status(400).json({
        success: false,
        error: 'Ticket tier is not currently on sale',
      });
    }

    // Check event capacity
    if (event.capacity && event.ticketsSold >= event.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Event is sold out',
      });
    }

    // Create ticket
    const ticket = await Ticket.create({
      eventId,
      userId,
      tierId,
      status: 'ACTIVE',
      purchaseDetails: {
        amount: tier.price,
        currency: 'USD',
        paymentMethod: paymentMethod || 'CARD',
        transactionId,
      },
    });

    // Update sold counts
    await TicketTier.findByIdAndUpdate(tierId, { $inc: { sold: 1 } });
    await Event.findByIdAndUpdate(eventId, { $inc: { ticketsSold: 1 } });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Purchase ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase ticket',
      message: error.message,
    });
  }
};

/**
 * Get user's tickets
 * GET /api/tickets/user
 */
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { status, upcoming = true } = req.query;

    const ticketQuery = { userId };
    if (status) {
      ticketQuery.status = status;
    }

    const tickets = await Ticket.find(ticketQuery)
      .populate('eventId')
      .populate('tierId')
      .sort({ purchasedAt: -1 });

    // Filter for upcoming events if requested
    let filteredTickets = tickets;
    if (upcoming) {
      filteredTickets = tickets.filter((ticket) => {
        return ticket.eventId && new Date(ticket.eventId.date) > new Date();
      });
    }

    res.json({
      success: true,
      data: filteredTickets,
      count: filteredTickets.length,
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tickets',
      message: error.message,
    });
  }
};

/**
 * Get ticket by QR code
 * GET /api/tickets/qr/:qrCode
 */
exports.getTicketByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params;

    const ticket = await Ticket.findOne({ qrCode })
      .populate('eventId')
      .populate('tierId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Get ticket by QR code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ticket',
      message: error.message,
    });
  }
};

/**
 * Transfer ticket
 * POST /api/tickets/:ticketId/transfer
 */
exports.transferTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { recipientUserId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!recipientUserId) {
      return res.status(400).json({
        success: false,
        error: 'Recipient user ID is required',
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only transfer your own tickets',
      });
    }

    // Transfer ticket (this creates a new ticket for recipient)
    const newTicket = await ticket.transfer(recipientUserId);

    res.json({
      success: true,
      data: {
        originalTicket: ticket,
        newTicket,
      },
    });
  } catch (error) {
    console.error('Transfer ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer ticket',
      message: error.message,
    });
  }
};

/**
 * Check in ticket (verify QR code)
 * POST /api/tickets/checkin
 */
exports.checkInTicket = async (req, res) => {
  try {
    const { qrCode, location } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required',
      });
    }

    const ticket = await Ticket.findOne({ qrCode })
      .populate('eventId')
      .populate('tierId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR code',
      });
    }

    // Check-in ticket
    await ticket.checkIn(location);

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket checked in successfully',
    });
  } catch (error) {
    console.error('Check in ticket error:', error);

    if (error.message === 'Ticket is not active') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to check in ticket',
      message: error.message,
    });
  }
};

/**
 * Cancel ticket (refund)
 * POST /api/tickets/:ticketId/cancel
 */
exports.cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const ticket = await Ticket.findById(ticketId).populate('eventId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    // Verify ownership
    if (ticket.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only cancel your own tickets',
      });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel active tickets',
      });
    }

    // Check if event is in the future (allow cancellation up to 24 hours before)
    const eventDate = new Date(ticket.eventId.date);
    const now = new Date();
    const hoursDiff = (eventDate - now) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel tickets within 24 hours of event',
      });
    }

    ticket.status = 'CANCELLED';
    await ticket.save();

    // Update sold counts
    await TicketTier.findByIdAndUpdate(ticket.tierId, { $inc: { sold: -1 } });
    await Event.findByIdAndUpdate(ticket.eventId, { $inc: { ticketsSold: -1 } });

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel ticket',
      message: error.message,
    });
  }
};
