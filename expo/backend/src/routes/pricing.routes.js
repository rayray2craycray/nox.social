/**
 * Pricing Routes
 * API endpoints for dynamic pricing and price alerts
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const DynamicPricing = require('../models/DynamicPricing');
const PriceAlert = require('../models/PriceAlert');

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== DYNAMIC PRICING =====

// Get current pricing for venue
router.get(
  '/dynamic/:venueId',
  [param('venueId').notEmpty(), validate],
  async (req, res) => {
    try {
      const { venueId } = req.params;

      const pricing = await DynamicPricing.getCurrentPricing(venueId);

      if (!pricing) {
        return res.json({
          success: true,
          data: null,
          message: 'No active pricing found',
        });
      }

      res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      console.error('Get current pricing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update venue pricing
router.post(
  '/dynamic/:venueId/update',
  [
    param('venueId').notEmpty(),
    body('basePrice').isFloat({ min: 0 }),
    body('conditions').optional().isObject(),
    validate,
  ],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { basePrice, conditions = {} } = req.body;

      const pricing = await DynamicPricing.updatePricing(venueId, basePrice, conditions);

      // Find and notify matching price alerts
      const matchingAlerts = await PriceAlert.findMatchingAlerts(venueId, pricing);

      // TODO: Send push notifications to users with matching alerts
      for (const alert of matchingAlerts) {
        await alert.markNotified();
      }

      res.json({
        success: true,
        data: pricing,
        alertsTriggered: matchingAlerts.length,
        message: 'Pricing updated successfully',
      });
    } catch (error) {
      console.error('Update pricing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Calculate pricing (preview without saving)
router.post(
  '/dynamic/calculate',
  [
    body('basePrice').isFloat({ min: 0 }),
    body('conditions').optional().isObject(),
    validate,
  ],
  async (req, res) => {
    try {
      const { basePrice, conditions = {} } = req.body;

      const calculated = DynamicPricing.calculatePrice(basePrice, conditions);

      res.json({
        success: true,
        data: {
          basePrice,
          ...calculated,
        },
      });
    } catch (error) {
      console.error('Calculate pricing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get pricing history
router.get(
  '/dynamic/:venueId/history',
  [
    param('venueId').notEmpty(),
    query('days').optional().isInt({ min: 1, max: 90 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { days = 7 } = req.query;

      const history = await DynamicPricing.getPricingHistory(venueId, parseInt(days));

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      console.error('Get pricing history error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get pricing stats
router.get(
  '/dynamic/:venueId/stats',
  [
    param('venueId').notEmpty(),
    query('days').optional().isInt({ min: 1, max: 365 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { days = 30 } = req.query;

      const stats = await DynamicPricing.getPricingStats(venueId, parseInt(days));

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get pricing stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Track pricing application
router.post(
  '/dynamic/:id/apply',
  [
    param('id').isMongoId(),
    body('pricePaid').isFloat({ min: 0 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { pricePaid } = req.body;

      const pricing = await DynamicPricing.findById(id);
      if (!pricing) {
        return res.status(404).json({
          success: false,
          error: 'Pricing not found',
        });
      }

      await pricing.trackApplication(pricePaid);

      res.json({
        success: true,
        data: pricing,
        message: 'Pricing application tracked',
      });
    } catch (error) {
      console.error('Track pricing application error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== PRICE ALERTS =====

// Create price alert
router.post(
  '/alerts',
  [
    body('userId').isMongoId(),
    body('venueId').notEmpty(),
    body('targetDiscount').isInt({ min: 0, max: 100 }),
    body('notificationPreference').optional().isIn(['PUSH', 'SMS', 'EMAIL', 'IN_APP']),
    body('expiresAt').optional().isISO8601(),
    body('conditions').optional().isObject(),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        userId,
        venueId,
        targetDiscount,
        notificationPreference = 'PUSH',
        expiresAt,
        conditions,
      } = req.body;

      const alert = await PriceAlert.create({
        userId,
        venueId,
        targetDiscount,
        notificationPreference,
        expiresAt,
        conditions,
      });

      await alert.populate('userId', 'displayName');

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Price alert created successfully',
      });
    } catch (error) {
      console.error('Create price alert error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user's alerts
router.get(
  '/alerts/user/:userId',
  [
    param('userId').isMongoId(),
    query('activeOnly').optional().isBoolean(),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { activeOnly = true } = req.query;

      const alerts = await PriceAlert.getUserAlerts(userId, activeOnly === 'true');

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error('Get user alerts error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get venue alerts (admin)
router.get(
  '/alerts/venue/:venueId',
  [param('venueId').notEmpty(), validate],
  async (req, res) => {
    try {
      const { venueId } = req.params;

      const alerts = await PriceAlert.getVenueAlerts(venueId);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error('Get venue alerts error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update price alert
router.put(
  '/alerts/:id',
  [
    param('id').isMongoId(),
    body('targetDiscount').optional().isInt({ min: 0, max: 100 }),
    body('notificationPreference').optional().isIn(['PUSH', 'SMS', 'EMAIL', 'IN_APP']),
    body('expiresAt').optional().isISO8601(),
    body('conditions').optional().isObject(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const alert = await PriceAlert.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      ).populate('userId', 'displayName');

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Price alert not found',
        });
      }

      res.json({
        success: true,
        data: alert,
        message: 'Price alert updated successfully',
      });
    } catch (error) {
      console.error('Update price alert error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Deactivate price alert
router.post(
  '/alerts/:id/deactivate',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const alert = await PriceAlert.findById(id);
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Price alert not found',
        });
      }

      await alert.deactivate();

      res.json({
        success: true,
        data: alert,
        message: 'Price alert deactivated',
      });
    } catch (error) {
      console.error('Deactivate alert error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Delete price alert
router.delete(
  '/alerts/:id',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const alert = await PriceAlert.findByIdAndDelete(id);
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Price alert not found',
        });
      }

      res.json({
        success: true,
        message: 'Price alert deleted successfully',
      });
    } catch (error) {
      console.error('Delete alert error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get alert stats
router.get(
  '/alerts/stats',
  [
    query('userId').optional().isMongoId(),
    query('venueId').optional().notEmpty(),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId, venueId } = req.query;

      const stats = await PriceAlert.getStats(userId, venueId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get alert stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== MAINTENANCE ENDPOINTS =====

// Deactivate expired pricing (cron job)
router.post('/maintenance/deactivate-expired-pricing', async (req, res) => {
  try {
    const count = await DynamicPricing.deactivateExpired();

    res.json({
      success: true,
      message: `Deactivated ${count} expired pricing entries`,
      count,
    });
  } catch (error) {
    console.error('Deactivate expired pricing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Deactivate expired alerts (cron job)
router.post('/maintenance/deactivate-expired-alerts', async (req, res) => {
  try {
    const count = await PriceAlert.deactivateExpired();

    res.json({
      success: true,
      message: `Deactivated ${count} expired price alerts`,
      count,
    });
  } catch (error) {
    console.error('Deactivate expired alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
