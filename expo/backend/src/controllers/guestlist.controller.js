const GuestList = require('../models/GuestList.model');
const Event = require('../models/Event.model');

/**
 * Add guest to list
 * POST /api/guestlist/add
 */
exports.addGuest = async (req, res) => {
  try {
    const {
      venueId,
      eventId,
      guestUserId,
      guestName,
      guestEmail,
      guestPhone,
      plusOnes,
      notes,
      vipStatus,
      table,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!venueId || !guestName) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID and guest name are required',
      });
    }

    // TODO: Verify user is venue staff/owner

    const guestEntry = await GuestList.create({
      venueId,
      eventId,
      guestUserId,
      guestName,
      guestEmail,
      guestPhone,
      plusOnes: plusOnes || 0,
      notes,
      addedBy: userId,
      vipStatus: vipStatus || false,
      table,
    });

    res.json({
      success: true,
      data: guestEntry,
    });
  } catch (error) {
    console.error('Add guest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add guest',
      message: error.message,
    });
  }
};

/**
 * Get guest list for venue
 * GET /api/guestlist/venue/:venueId
 */
exports.getVenueGuestList = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { eventId, status, date } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const query = { venueId };

    if (eventId) {
      query.eventId = eventId;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      // Filter by date if event specified
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const guestList = await GuestList.find(query)
      .populate('eventId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: guestList,
      count: guestList.length,
    });
  } catch (error) {
    console.error('Get guest list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get guest list',
      message: error.message,
    });
  }
};

/**
 * Get guest list for event
 * GET /api/guestlist/event/:eventId
 */
exports.getEventGuestList = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    const query = { eventId };

    if (status) {
      query.status = status;
    }

    const guestList = await GuestList.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: guestList,
      count: guestList.length,
    });
  } catch (error) {
    console.error('Get event guest list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event guest list',
      message: error.message,
    });
  }
};

/**
 * Check in guest
 * POST /api/guestlist/:guestId/checkin
 */
exports.checkInGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const guestEntry = await GuestList.findById(guestId);

    if (!guestEntry) {
      return res.status(404).json({
        success: false,
        error: 'Guest entry not found',
      });
    }

    await guestEntry.checkIn(userId);

    res.json({
      success: true,
      data: guestEntry,
      message: 'Guest checked in successfully',
    });
  } catch (error) {
    console.error('Check in guest error:', error);

    if (error.message.includes('already checked in') || error.message.includes('cancelled')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to check in guest',
      message: error.message,
    });
  }
};

/**
 * Confirm guest
 * POST /api/guestlist/:guestId/confirm
 */
exports.confirmGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const guestEntry = await GuestList.findById(guestId);

    if (!guestEntry) {
      return res.status(404).json({
        success: false,
        error: 'Guest entry not found',
      });
    }

    await guestEntry.confirm();

    res.json({
      success: true,
      data: guestEntry,
      message: 'Guest confirmed successfully',
    });
  } catch (error) {
    console.error('Confirm guest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm guest',
      message: error.message,
    });
  }
};

/**
 * Mark guest as no-show
 * POST /api/guestlist/:guestId/noshow
 */
exports.markNoShow = async (req, res) => {
  try {
    const { guestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const guestEntry = await GuestList.findById(guestId);

    if (!guestEntry) {
      return res.status(404).json({
        success: false,
        error: 'Guest entry not found',
      });
    }

    await guestEntry.markNoShow();

    res.json({
      success: true,
      data: guestEntry,
      message: 'Guest marked as no-show',
    });
  } catch (error) {
    console.error('Mark no-show error:', error);

    if (error.message.includes('Cannot mark as no-show')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to mark as no-show',
      message: error.message,
    });
  }
};

/**
 * Update guest entry
 * PATCH /api/guestlist/:guestId
 */
exports.updateGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const updates = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const guestEntry = await GuestList.findById(guestId);

    if (!guestEntry) {
      return res.status(404).json({
        success: false,
        error: 'Guest entry not found',
      });
    }

    // Update allowed fields
    const allowedFields = [
      'guestName',
      'guestEmail',
      'guestPhone',
      'plusOnes',
      'notes',
      'vipStatus',
      'table',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        guestEntry[field] = updates[field];
      }
    });

    await guestEntry.save();

    res.json({
      success: true,
      data: guestEntry,
    });
  } catch (error) {
    console.error('Update guest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update guest',
      message: error.message,
    });
  }
};

/**
 * Remove guest from list
 * DELETE /api/guestlist/:guestId
 */
exports.removeGuest = async (req, res) => {
  try {
    const { guestId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is venue staff/owner

    const guestEntry = await GuestList.findById(guestId);

    if (!guestEntry) {
      return res.status(404).json({
        success: false,
        error: 'Guest entry not found',
      });
    }

    if (guestEntry.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove checked-in guests',
      });
    }

    await GuestList.findByIdAndDelete(guestId);

    res.json({
      success: true,
      message: 'Guest removed from list',
    });
  } catch (error) {
    console.error('Remove guest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove guest',
      message: error.message,
    });
  }
};

/**
 * Search guest list
 * GET /api/guestlist/search
 */
exports.searchGuestList = async (req, res) => {
  try {
    const { venueId, query } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!venueId || !query) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID and search query are required',
      });
    }

    // TODO: Verify user is venue staff/owner

    const searchQuery = {
      venueId,
      $or: [
        { guestName: { $regex: query, $options: 'i' } },
        { guestEmail: { $regex: query, $options: 'i' } },
        { guestPhone: { $regex: query, $options: 'i' } },
      ],
    };

    const results = await GuestList.find(searchQuery)
      .populate('eventId')
      .limit(50)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search guest list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search guest list',
      message: error.message,
    });
  }
};
