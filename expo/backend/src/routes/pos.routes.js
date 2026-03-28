/**
 * POS Integration Routes
 * API endpoints for Toast and Square POS integration
 */

const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos.controller');
const spendRulesController = require('../controllers/spend-rules.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validation');
const {
  connectPOSSchema,
  validateCredentialsSchema,
  createSpendRuleSchema,
  updateSpendRuleSchema,
} = require('../validators/pos.validator');

// ============================================================================
// POS Integration Management
// ============================================================================

/**
 * Connect POS system
 * POST /api/pos/connect
 * Body: { venueId, provider: 'TOAST' | 'SQUARE', credentials: { apiKey, locationId, environment } }
 * Auth: Required (HEAD_MODERATOR)
 */
router.post('/connect', authMiddleware, validate(connectPOSSchema), posController.connectPOS);

/**
 * Get POS integration status
 * GET /api/pos/status/:venueId
 * Auth: Required
 */
router.get('/status/:venueId', authMiddleware, posController.getPOSStatus);

/**
 * Disconnect POS system
 * POST /api/pos/disconnect/:venueId
 * Auth: Required (HEAD_MODERATOR)
 */
router.post('/disconnect/:venueId', authMiddleware, posController.disconnectPOS);

/**
 * Validate POS credentials
 * POST /api/pos/validate
 * Body: { provider, credentials }
 * Auth: Required
 */
router.post('/validate', authMiddleware, validate(validateCredentialsSchema), posController.validateCredentials);

// ============================================================================
// Transaction Management
// ============================================================================

/**
 * Sync transactions from POS
 * POST /api/pos/sync/:venueId
 * Body: { fromDate?, toDate?, processRules? }
 * Auth: Required (HEAD_MODERATOR)
 */
router.post('/sync/:venueId', authMiddleware, posController.syncTransactions);

/**
 * Get transactions for venue
 * GET /api/pos/transactions/:venueId
 * Query: limit, offset, status, startDate, endDate
 * Auth: Required
 */
router.get('/transactions/:venueId', authMiddleware, posController.getTransactions);

/**
 * Get venue revenue
 * GET /api/pos/revenue/:venueId
 * Query: period (day, week, month, year, all)
 * Auth: Required
 */
router.get('/revenue/:venueId', authMiddleware, posController.getRevenue);

// ============================================================================
// Spend Rules Management
// ============================================================================

/**
 * Get spend rules for venue
 * GET /api/pos/rules/:venueId
 * Auth: Required
 */
router.get('/rules/:venueId', authMiddleware, spendRulesController.getRules);

/**
 * Create spend rule
 * POST /api/pos/rules/:venueId
 * Body: { threshold, tierUnlocked, serverAccessLevel, isLiveOnly?, liveTimeWindow?, performerId? }
 * Auth: Required (HEAD_MODERATOR)
 */
router.post('/rules/:venueId', authMiddleware, validate(createSpendRuleSchema), spendRulesController.createRule);

/**
 * Update spend rule
 * PATCH /api/pos/rules/:venueId/:ruleId
 * Body: Partial spend rule fields
 * Auth: Required (HEAD_MODERATOR)
 */
router.patch('/rules/:venueId/:ruleId', authMiddleware, validate(updateSpendRuleSchema), spendRulesController.updateRule);

/**
 * Delete spend rule
 * DELETE /api/pos/rules/:venueId/:ruleId
 * Auth: Required (HEAD_MODERATOR)
 */
router.delete('/rules/:venueId/:ruleId', authMiddleware, spendRulesController.deleteRule);

/**
 * Toggle spend rule active status
 * POST /api/pos/rules/:venueId/:ruleId/toggle
 * Auth: Required (HEAD_MODERATOR)
 */
router.post('/rules/:venueId/:ruleId/toggle', authMiddleware, spendRulesController.toggleRule);

// ============================================================================
// Webhooks (Square only)
// ============================================================================

/**
 * Square webhook receiver
 * POST /api/pos/webhooks/square
 * No auth required (verified by signature)
 */
router.post('/webhooks/square', posController.squareWebhook);

module.exports = router;
