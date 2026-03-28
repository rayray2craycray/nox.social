/**
 * Venue Management Controller
 * Handles venue updates, permissions, and role management
 */

const Venue = require('../models/Venue');
const VenueRole = require('../models/VenueRole');
const BusinessProfile = require('../models/BusinessProfile');

/**
 * Get user's venue roles
 * GET /api/venues/roles
 */
exports.getUserVenueRoles = async (req, res) => {
  try {
    const userId = req.user._id;

    const roles = await VenueRole.find({
      userId,
      isActive: true,
    }).populate('venueId', 'name type location.city location.state imageUrl');

    // Format response
    const formattedRoles = roles.map((role) => ({
      id: role._id,
      venueId: role.venueId._id,
      venueName: role.venueId.name,
      venueType: role.venueId.type,
      venueLocation: `${role.venueId.location.city}, ${role.venueId.location.state}`,
      venueImage: role.venueId.imageUrl,
      role: role.role,
      permissions: role.permissions,
      assignedAt: role.assignedAt,
      isActive: role.isActive,
    }));

    res.json({
      success: true,
      data: {
        roles: formattedRoles,
      },
    });
  } catch (error) {
    console.error('Get venue roles error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get venue details
 * GET /api/venues/:venueId
 */
exports.getVenueDetails = async (req, res) => {
  try {
    const { venueId } = req.params;

    const venue = await Venue.findById(venueId).populate(
      'businessProfileId',
      'businessEmail phone website'
    );

    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found',
      });
    }

    // Check if user has any role for this venue
    let userRole = null;
    if (req.user) {
      userRole = await VenueRole.findOne({
        venueId,
        userId: req.user._id,
        isActive: true,
      });
    }

    res.json({
      success: true,
      data: {
        venue,
        userRole: userRole
          ? {
              role: userRole.role,
              permissions: userRole.permissions,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Get venue details error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Update venue information
 * PATCH /api/venues/:venueId/info
 */
exports.updateVenueInfo = async (req, res) => {
  try {
    const { venueId } = req.params;
    const updates = req.body;

    // Permission check is done by middleware
    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found',
      });
    }

    // Fields that can be updated
    const allowedFields = [
      'name',
      'location',
      'coverCharge',
      'hours',
      'tags',
      'capacity',
      'priceLevel',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        if (field === 'location' && typeof updates[field] === 'object') {
          // Merge location updates
          venue.location = { ...venue.location.toObject(), ...updates[field] };
        } else if (field === 'hours' && typeof updates[field] === 'object') {
          // Merge hours updates
          venue.hours = { ...venue.hours.toObject(), ...updates[field] };
        } else {
          venue[field] = updates[field];
        }
      }
    });

    await venue.save();

    res.json({
      success: true,
      data: {
        venue,
      },
      message: 'Venue information updated successfully',
    });
  } catch (error) {
    console.error('Update venue info error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Update venue display (images, description, tags)
 * PATCH /api/venues/:venueId/display
 */
exports.updateVenueDisplay = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { imageUrl, description, tags, genres } = req.body;

    // Permission check is done by middleware
    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found',
      });
    }

    // Update display fields
    if (imageUrl !== undefined) venue.imageUrl = imageUrl;
    if (description !== undefined) venue.description = description;
    if (tags !== undefined) venue.tags = tags;
    if (genres !== undefined) venue.genres = genres;

    await venue.save();

    res.json({
      success: true,
      data: {
        venue,
      },
      message: 'Venue display updated successfully',
    });
  } catch (error) {
    console.error('Update venue display error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Assign role to user for venue
 * POST /api/venues/:venueId/roles
 */
exports.assignVenueRole = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { userId, role, permissions } = req.body;

    // Must have MANAGE_STAFF permission (checked by middleware)
    const assignerId = req.user._id;

    // Validate role
    const validRoles = ['HEAD_MODERATOR', 'MODERATOR', 'STAFF', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found',
      });
    }

    // Check if role already exists
    let venueRole = await VenueRole.findOne({
      venueId,
      userId,
    });

    if (venueRole) {
      // Update existing role
      venueRole.role = role;
      venueRole.permissions = permissions || VenueRole.DEFAULT_PERMISSIONS[role];
      venueRole.assignedBy = assignerId;
      venueRole.assignedAt = new Date();
      venueRole.isActive = true;
      await venueRole.save();
    } else {
      // Create new role
      venueRole = await VenueRole.create({
        venueId,
        userId,
        role,
        permissions: permissions || VenueRole.DEFAULT_PERMISSIONS[role],
        assignedBy: assignerId,
        assignedAt: new Date(),
        isActive: true,
      });
    }

    res.json({
      success: true,
      data: {
        venueRole,
      },
      message: 'Role assigned successfully',
    });
  } catch (error) {
    console.error('Assign venue role error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Remove role from user for venue
 * DELETE /api/venues/:venueId/roles/:roleId
 */
exports.removeVenueRole = async (req, res) => {
  try {
    const { venueId, roleId } = req.params;

    // Must have MANAGE_STAFF permission (checked by middleware)
    const venueRole = await VenueRole.findOne({
      _id: roleId,
      venueId,
    });

    if (!venueRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Cannot remove HEAD_MODERATOR role
    if (venueRole.role === 'HEAD_MODERATOR') {
      return res.status(403).json({
        success: false,
        error: 'Cannot remove HEAD_MODERATOR role',
      });
    }

    // Deactivate role instead of deleting
    venueRole.isActive = false;
    await venueRole.save();

    res.json({
      success: true,
      message: 'Role removed successfully',
    });
  } catch (error) {
    console.error('Remove venue role error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get venue staff/roles
 * GET /api/venues/:venueId/staff
 */
exports.getVenueStaff = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Must have VIEW_ANALYTICS permission (checked by middleware)
    const roles = await VenueRole.find({
      venueId,
      isActive: true,
    })
      .populate('userId', 'username email profilePicture')
      .sort({ assignedAt: -1 });

    const formattedStaff = roles.map((role) => ({
      id: role._id,
      user: {
        id: role.userId._id,
        username: role.userId.username,
        email: role.userId.email,
        profilePicture: role.userId.profilePicture,
      },
      role: role.role,
      permissions: role.permissions,
      assignedAt: role.assignedAt,
    }));

    res.json({
      success: true,
      data: {
        staff: formattedStaff,
      },
    });
  } catch (error) {
    console.error('Get venue staff error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

module.exports = exports;
