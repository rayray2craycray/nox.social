/**
 * Venue Management Routes
 * Handles venue operations with role-based permissions
 */

const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venue.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation');
const {
  updateVenueInfoSchema,
  updateVenueDisplaySchema,
  assignVenueRoleSchema,
} = require('../validators/venues.validator');
const {
  checkVenuePermission,
  hasVenueAccess,
  isHeadModerator,
} = require('../middleware/venuePermissions');

/**
 * GET /api/venues/roles
 * Get current user's venue roles
 * Requires authentication
 */
router.get('/roles', authMiddleware, venueController.getUserVenueRoles);

/**
 * GET /api/venues/:venueId
 * Get venue details
 * Public route (authentication optional for role info)
 */
router.get('/:venueId', venueController.getVenueDetails);

/**
 * PATCH /api/venues/:venueId/info
 * Update venue basic information (name, location, hours, etc.)
 * Requires EDIT_VENUE_INFO permission
 */
router.patch(
  '/:venueId/info',
  authMiddleware,
  checkVenuePermission('EDIT_VENUE_INFO'),
  validate(updateVenueInfoSchema),
  venueController.updateVenueInfo
);

/**
 * PATCH /api/venues/:venueId/display
 * Update venue display (images, description, tags)
 * Requires EDIT_VENUE_DISPLAY permission
 */
router.patch(
  '/:venueId/display',
  authMiddleware,
  checkVenuePermission('EDIT_VENUE_DISPLAY'),
  validate(updateVenueDisplaySchema),
  venueController.updateVenueDisplay
);

/**
 * POST /api/venues/:venueId/roles
 * Assign role to user for venue
 * Requires MANAGE_STAFF permission
 */
router.post(
  '/:venueId/roles',
  authMiddleware,
  checkVenuePermission('MANAGE_STAFF'),
  validate(assignVenueRoleSchema),
  venueController.assignVenueRole
);

/**
 * DELETE /api/venues/:venueId/roles/:roleId
 * Remove role from user
 * Requires MANAGE_STAFF permission
 */
router.delete(
  '/:venueId/roles/:roleId',
  authMiddleware,
  checkVenuePermission('MANAGE_STAFF'),
  venueController.removeVenueRole
);

/**
 * GET /api/venues/:venueId/staff
 * Get venue staff list
 * Requires VIEW_ANALYTICS permission
 */
router.get(
  '/:venueId/staff',
  authMiddleware,
  checkVenuePermission('VIEW_ANALYTICS'),
  venueController.getVenueStaff
);

module.exports = router;
