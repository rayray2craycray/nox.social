/**
 * Moderation Routes
 * API endpoints for content reporting, user blocking, and moderation
 */

const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');

// ============================================================================
// User Endpoints (Reports & Blocking)
// ============================================================================

/**
 * Submit a report
 * POST /api/moderation/reports
 * Body: { contentType, contentId, reason, details?, reportedUserId? }
 * Auth: Required
 */
router.post('/reports', authMiddleware, moderationController.submitReport);

/**
 * Get user's submitted reports
 * GET /api/moderation/reports/my
 * Query: limit, offset
 * Auth: Required
 */
router.get('/reports/my', authMiddleware, moderationController.getMyReports);

/**
 * Block a user
 * POST /api/moderation/block
 * Body: { userId }
 * Auth: Required
 */
router.post('/block', authMiddleware, moderationController.blockUser);

/**
 * Unblock a user
 * DELETE /api/moderation/block/:userId
 * Auth: Required
 */
router.delete('/block/:userId', authMiddleware, moderationController.unblockUser);

/**
 * Get list of blocked users
 * GET /api/moderation/blocked
 * Query: limit, offset
 * Auth: Required
 */
router.get('/blocked', authMiddleware, moderationController.getBlockedUsers);

/**
 * Check if a user is blocked
 * GET /api/moderation/blocked/check/:userId
 * Auth: Required
 */
router.get('/blocked/check/:userId', authMiddleware, moderationController.checkIfBlocked);

// ============================================================================
// Moderator/Admin Endpoints
// ============================================================================

/**
 * Get moderation queue
 * GET /api/moderation/queue
 * Query: status, contentType, limit, offset
 * Auth: Moderator/Admin only
 */
router.get('/queue', authMiddleware, adminMiddleware, moderationController.getModerationQueue);

/**
 * Update report status
 * PATCH /api/moderation/reports/:reportId
 * Body: { status?, moderationAction?, moderatorNotes? }
 * Auth: Moderator/Admin only
 */
router.patch('/reports/:reportId', authMiddleware, adminMiddleware, moderationController.updateReport);

/**
 * Get moderation statistics
 * GET /api/moderation/stats
 * Auth: Admin only
 */
router.get('/stats', authMiddleware, adminMiddleware, moderationController.getModerationStats);

module.exports = router;
