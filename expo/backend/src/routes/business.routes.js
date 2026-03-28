/**
 * Business Profile Routes
 * Handles business registration, verification, and profile management
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Rate limiter for registration - 3 attempts per hour per IP
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test', // Skip in test environment
});

// Rate limiter for resending verification - 3 attempts per 15 minutes
const resendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    success: false,
    error: 'Too many resend attempts. Please wait 15 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * POST /api/business/register
 * Register a new business profile
 * Requires authentication (user must create account first) + rate limiting
 */
router.post(
  '/register',
  registrationLimiter,
  authMiddleware,
  businessController.registerBusiness
);

/**
 * GET /api/business/verify-email/:token
 * Verify business email with token
 * Public route (no auth required - token is proof)
 */
router.get('/verify-email/:token', businessController.verifyEmail);

/**
 * POST /api/business/resend-verification
 * Resend verification email
 * Requires authentication + rate limiting
 */
router.post(
  '/resend-verification',
  resendLimiter,
  authMiddleware,
  businessController.resendVerificationEmail
);

/**
 * GET /api/business/profile
 * Get current user's business profile
 * Requires authentication
 */
router.get('/profile', authMiddleware, businessController.getBusinessProfile);

/**
 * PATCH /api/business/profile
 * Update business profile
 * Requires authentication
 */
router.patch('/profile', authMiddleware, businessController.updateBusinessProfile);

/**
 * POST /api/business/documents/upload
 * Upload verification document
 * Requires authentication
 */
router.post('/documents/upload', authMiddleware, businessController.uploadDocument);

/**
 * GET /api/business/documents
 * Get all documents for business profile
 * Requires authentication
 */
router.get('/documents', authMiddleware, businessController.getDocuments);

/**
 * DELETE /api/business/documents/:documentId
 * Delete a document
 * Requires authentication
 */
router.delete('/documents/:documentId', authMiddleware, businessController.deleteDocument);

module.exports = router;
