const Crew = require('../models/Crew');

/**
 * Create a new crew
 * POST /api/social/crews
 */
exports.createCrew = async (req, res) => {
  try {
    const { name, description, isPrivate, imageUrl } = req.body;
    const ownerId = req.user?.userId;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Crew name is required',
      });
    }

    const crew = await Crew.create({
      name: name.trim(),
      description: description?.trim(),
      ownerId,
      memberIds: [ownerId], // Owner is automatically a member
      isPrivate: isPrivate || false,
      imageUrl,
    });

    res.json({
      success: true,
      data: crew,
    });
  } catch (error) {
    console.error('Create crew error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create crew',
      message: error.message,
    });
  }
};

/**
 * Get user's crews
 * GET /api/social/crews/user
 */
exports.getUserCrews = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const crews = await Crew.find({
      memberIds: userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: crews,
    });
  } catch (error) {
    console.error('Get user crews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crews',
      message: error.message,
    });
  }
};

/**
 * Get crew by ID
 * GET /api/social/crews/:crewId
 */
exports.getCrewById = async (req, res) => {
  try {
    const { crewId } = req.params;
    const userId = req.user?.userId;

    const crew = await Crew.findById(crewId);

    if (!crew) {
      return res.status(404).json({
        success: false,
        error: 'Crew not found',
      });
    }

    // If private, only members can view
    if (crew.isPrivate && !crew.memberIds.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'This crew is private',
      });
    }

    res.json({
      success: true,
      data: crew,
    });
  } catch (error) {
    console.error('Get crew error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get crew',
      message: error.message,
    });
  }
};

/**
 * Join a crew
 * POST /api/social/crews/:crewId/join
 */
exports.joinCrew = async (req, res) => {
  try {
    const { crewId } = req.params;
    const { inviteCode } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const crew = await Crew.findById(crewId);

    if (!crew) {
      return res.status(404).json({
        success: false,
        error: 'Crew not found',
      });
    }

    // Check if already a member
    if (crew.memberIds.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this crew',
      });
    }

    // If private, verify invite code
    if (crew.isPrivate) {
      if (!inviteCode || inviteCode !== crew.inviteCode) {
        return res.status(403).json({
          success: false,
          error: 'Invalid invite code',
        });
      }
    }

    // Add user to crew
    crew.memberIds.push(userId);
    await crew.save();

    res.json({
      success: true,
      data: crew,
    });
  } catch (error) {
    console.error('Join crew error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join crew',
      message: error.message,
    });
  }
};

/**
 * Leave a crew
 * POST /api/social/crews/:crewId/leave
 */
exports.leaveCrew = async (req, res) => {
  try {
    const { crewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const crew = await Crew.findById(crewId);

    if (!crew) {
      return res.status(404).json({
        success: false,
        error: 'Crew not found',
      });
    }

    // Cannot leave if you're the owner
    if (crew.ownerId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Owner cannot leave crew. Transfer ownership or delete the crew.',
      });
    }

    // Check if member
    if (!crew.memberIds.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'You are not a member of this crew',
      });
    }

    // Remove user from crew
    crew.memberIds = crew.memberIds.filter((id) => id !== userId);
    await crew.save();

    res.json({
      success: true,
      message: 'Left crew successfully',
    });
  } catch (error) {
    console.error('Leave crew error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave crew',
      message: error.message,
    });
  }
};

/**
 * Update crew
 * PATCH /api/social/crews/:crewId
 */
exports.updateCrew = async (req, res) => {
  try {
    const { crewId } = req.params;
    const { name, description, imageUrl } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const crew = await Crew.findById(crewId);

    if (!crew) {
      return res.status(404).json({
        success: false,
        error: 'Crew not found',
      });
    }

    // Only owner can update
    if (crew.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can update the crew',
      });
    }

    // Update fields
    if (name) crew.name = name.trim();
    if (description !== undefined) crew.description = description?.trim();
    if (imageUrl !== undefined) crew.imageUrl = imageUrl;

    await crew.save();

    res.json({
      success: true,
      data: crew,
    });
  } catch (error) {
    console.error('Update crew error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update crew',
      message: error.message,
    });
  }
};

/**
 * Delete crew
 * DELETE /api/social/crews/:crewId
 */
exports.deleteCrew = async (req, res) => {
  try {
    const { crewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const crew = await Crew.findById(crewId);

    if (!crew) {
      return res.status(404).json({
        success: false,
        error: 'Crew not found',
      });
    }

    // Only owner can delete
    if (crew.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can delete the crew',
      });
    }

    await Crew.findByIdAndDelete(crewId);

    res.json({
      success: true,
      message: 'Crew deleted successfully',
    });
  } catch (error) {
    console.error('Delete crew error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete crew',
      message: error.message,
    });
  }
};

/**
 * Invite user to crew (generates shareable link)
 * GET /api/social/crews/:crewId/invite
 */
exports.getInviteCode = async (req, res) => {
  try {
    const { crewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const crew = await Crew.findById(crewId);

    if (!crew) {
      return res.status(404).json({
        success: false,
        error: 'Crew not found',
      });
    }

    // Only members can get invite code
    if (!crew.memberIds.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Only crew members can invite others',
      });
    }

    res.json({
      success: true,
      data: {
        inviteCode: crew.inviteCode,
        crewId: crew._id,
        crewName: crew.name,
      },
    });
  } catch (error) {
    console.error('Get invite code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invite code',
      message: error.message,
    });
  }
};
