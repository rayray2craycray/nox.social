/**
 * Admin Routes
 * Endpoints for admin dashboard and business profile review
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * GET /api/admin/business-profiles
 * Get all business profiles with filters
 * Query params: status, emailVerified, documentsSubmitted, documentsApproved, page, limit, sortBy, sortOrder
 */
router.get('/business-profiles', adminController.getBusinessProfiles);

/**
 * GET /api/admin/business-profiles/:id
 * Get business profile details
 */
router.get('/business-profiles/:id', adminController.getBusinessProfileDetails);

/**
 * PUT /api/admin/business-profiles/:id/review
 * Approve or reject business profile
 * Body: { action: 'APPROVE' | 'REJECT', rejectionReason?: string }
 */
router.put('/business-profiles/:id/review', adminController.reviewBusinessProfile);

/**
 * PUT /api/admin/business-profiles/:id/documents/:documentId/review
 * Approve or reject individual document
 * Body: { action: 'APPROVE' | 'REJECT', rejectionReason?: string, notes?: string }
 */
router.put(
  '/business-profiles/:id/documents/:documentId/review',
  adminController.reviewDocument
);

module.exports = router;
