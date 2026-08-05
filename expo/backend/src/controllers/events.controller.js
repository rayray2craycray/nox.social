const Event = require('../models/Event.model');
const TicketTier = require('../models/TicketTier.model');

/**
 * Get upcoming events
 * GET /api/events
 */
exports.getEvents = async (req, res) => {
  try {
    const { venueId, status = 'PUBLISHED', limit = 50 } = req.query;

    const query = { status };

    if (venueId) {
      query.venueId = venueId;
    }

    // Only show upcoming events by default
    query.date = { $gte: new Date() };

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(parseInt(limit));

    // Attach ticket tiers. Tiers are a separate collection (TicketTier) keyed
    // by eventId, but the app expects them embedded as event.ticketTiers —
    // without this the event screen shows no tiers and no buy button, making
    // ticket purchase (and Apple Pay) unreachable through the UI.
    const eventIds = events.map((e) => e._id);
    const tiers = await TicketTier.find({ eventId: { $in: eventIds } });
    const tiersByEvent = tiers.reduce((acc, t) => {
      const k = t.eventId.toString();
      (acc[k] = acc[k] || []).push(t);
      return acc;
    }, {});
    const data = events.map((e) => ({
      ...e.toObject(),
      ticketTiers: tiersByEvent[e._id.toString()] || [],
    }));

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get events',
      message: error.message,
    });
  }
};

/**
 * Get event by ID
 * GET /api/events/:eventId
 */
exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Get ticket tiers for this event
    const ticketTiers = await TicketTier.find({ eventId });

    res.json({
      success: true,
      data: {
        event,
        ticketTiers,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event',
      message: error.message,
    });
  }
};

/**
 * Log a "Get Tickets" tap for attribution.
 * POST /api/events/:eventId/ticket-tap
 *
 * Fire-and-forget from the client right before it opens the external ticket
 * URL. Increments a per-event counter that the venue dashboard surfaces as
 * click-through attribution. No auth required — a tap is a tap.
 */
exports.logTicketTap = async (req, res) => {
  try {
    await Event.updateOne({ _id: req.params.eventId }, { $inc: { ticketTaps: 1 } });
    return res.json({ success: true });
  } catch (error) {
    // Never let attribution logging block the user's redirect.
    console.error('logTicketTap error:', error.message);
    return res.json({ success: false });
  }
};

/**
 * Create event
 * POST /api/events
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      venueId,
      venueName,
      title,
      description,
      performerIds,
      performerNames,
      date,
      startTime,
      endTime,
      imageUrl,
      genres,
      ageRestriction,
      capacity,
      tags,
      ticketTiers,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue owner or admin

    if (!venueId || !venueName || !title || !date || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Create event
    const event = await Event.create({
      venueId,
      venueName,
      title,
      description,
      performerIds: performerIds || [],
      performerNames: performerNames || [],
      date: new Date(date),
      startTime,
      endTime,
      imageUrl,
      genres: genres || [],
      ageRestriction: ageRestriction || 21,
      capacity,
      tags: tags || [],
    });

    // Create ticket tiers if provided
    if (ticketTiers && ticketTiers.length > 0) {
      const tierDocs = ticketTiers.map((tier) => ({
        eventId: event._id,
        name: tier.name,
        description: tier.description,
        price: tier.price,
        quantity: tier.quantity,
        tier: tier.tier || 'GENERAL',
        salesWindow: {
          start: new Date(tier.salesWindow.start),
          end: new Date(tier.salesWindow.end),
        },
        isAppExclusive: tier.isAppExclusive || false,
        benefits: tier.benefits || [],
      }));

      await TicketTier.insertMany(tierDocs);
    }

    // Get created tiers
    const createdTiers = await TicketTier.find({ eventId: event._id });

    res.json({
      success: true,
      data: {
        event,
        ticketTiers: createdTiers,
      },
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      message: error.message,
    });
  }
};

/**
 * Update event
 * PATCH /api/events/:eventId
 */
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // TODO: Verify user is venue owner or admin

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'performerIds',
      'performerNames',
      'date',
      'startTime',
      'endTime',
      'imageUrl',
      'genres',
      'ageRestriction',
      'capacity',
      'tags',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        event[field] = updates[field];
      }
    });

    await event.save();

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      message: error.message,
    });
  }
};

/**
 * Delete event
 * DELETE /api/events/:eventId
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // TODO: Verify user is venue owner or admin

    // Check if tickets have been sold
    if (event.ticketsSold > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete event with sold tickets. Cancel instead.',
      });
    }

    await Event.findByIdAndDelete(eventId);
    await TicketTier.deleteMany({ eventId });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error.message,
    });
  }
};

/**
 * Get venue events
 * GET /api/events/venue/:venueId
 */
exports.getVenueEvents = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { includePast = false } = req.query;

    const query = {
      venueId,
      status: 'PUBLISHED',
    };

    if (!includePast) {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query).sort({ date: 1 });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Get venue events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get venue events',
      message: error.message,
    });
  }
};
