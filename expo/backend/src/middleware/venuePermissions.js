/**
 * Venue Permission Middleware
 * Checks if user has required permissions for venue operations
 */

const VenueRole = require('../models/VenueRole');

/**
 * Check if user has a specific permission for a venue
 */
const checkVenuePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { venueId } = req.params;
      const userId = req.user._id;

      // Find user's role for this venue
      const role = await VenueRole.findOne({
        venueId,
        userId,
        isActive: true,
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          error: 'You do not have access to this venue',
        });
      }

      // HEAD_MODERATOR and FULL_ACCESS have all permissions
      const hasPermission =
        role.role === 'HEAD_MODERATOR' ||
        role.permissions.includes('FULL_ACCESS') ||
        role.permissions.includes(requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Permission '${requiredPermission}' required`,
        });
      }

      // Attach role to request for later use
      req.venueRole = role;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user has any role for the venue (for viewing)
 */
const hasVenueAccess = async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const userId = req.user._id;

    const role = await VenueRole.findOne({
      venueId,
      userId,
      isActive: true,
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this venue',
      });
    }

    req.venueRole = role;
    next();
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Check if user is HEAD_MODERATOR
 */
const isHeadModerator = async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const userId = req.user._id;

    const role = await VenueRole.findOne({
      venueId,
      userId,
      role: 'HEAD_MODERATOR',
      isActive: true,
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'HEAD_MODERATOR access required',
      });
    }

    req.venueRole = role;
    next();
  } catch (error) {
    console.error('Head moderator check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  checkVenuePermission,
  hasVenueAccess,
  isHeadModerator,
};
