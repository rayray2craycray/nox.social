/**
 * Growth Features Routes
 * API endpoints for group purchases, referrals, and sharing
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const GroupPurchase = require('../models/GroupPurchase');
const Referral = require('../models/Referral');

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== GROUP PURCHASES =====

// Create group purchase
router.post(
  '/group-purchases',
  [
    body('initiatorId').isMongoId(),
    body('venueId').notEmpty(),
    body('ticketType').isIn(['ENTRY', 'TABLE', 'BOTTLE_SERVICE']),
    body('totalAmount').isFloat({ min: 0 }),
    body('maxParticipants').isInt({ min: 2, max: 20 }),
    body('expiresAt').isISO8601(),
    validate,
  ],
  async (req, res) => {
    try {
      const { initiatorId, venueId, eventId, ticketType, totalAmount, maxParticipants, expiresAt } = req.body;

      const perPersonAmount = totalAmount / maxParticipants;

      const groupPurchase = await GroupPurchase.create({
        initiatorId,
        venueId,
        eventId,
        ticketType,
        totalAmount,
        perPersonAmount,
        maxParticipants,
        currentParticipants: [initiatorId],
        expiresAt,
      });

      await groupPurchase.populate('initiatorId', 'displayName avatarUrl');

      res.status(201).json({
        success: true,
        data: groupPurchase,
      });
    } catch (error) {
      console.error('Create group purchase error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get group purchases for venue
router.get(
  '/group-purchases/venue/:venueId',
  [param('venueId').notEmpty(), validate],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const groupPurchases = await GroupPurchase.getOpenForVenue(venueId);

      res.json({
        success: true,
        data: groupPurchases,
        count: groupPurchases.length,
      });
    } catch (error) {
      console.error('Get venue group purchases error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user's group purchases
router.get(
  '/group-purchases/user/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const groupPurchases = await GroupPurchase.find({
        $or: [
          { initiatorId: userId },
          { currentParticipants: userId },
        ],
      })
        .populate('initiatorId', 'displayName avatarUrl')
        .populate('currentParticipants', 'displayName avatarUrl')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: groupPurchases,
        count: groupPurchases.length,
      });
    } catch (error) {
      console.error('Get user group purchases error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Join group purchase
router.post(
  '/group-purchases/:id/join',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const groupPurchase = await GroupPurchase.findById(id);
      if (!groupPurchase) {
        return res.status(404).json({
          success: false,
          error: 'Group purchase not found',
        });
      }

      await groupPurchase.addParticipant(userId);
      await groupPurchase.populate('currentParticipants', 'displayName avatarUrl');

      res.json({
        success: true,
        data: groupPurchase,
        message: 'Successfully joined group purchase',
      });
    } catch (error) {
      console.error('Join group purchase error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Complete group purchase
router.post(
  '/group-purchases/:id/complete',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const groupPurchase = await GroupPurchase.findById(id);
      if (!groupPurchase) {
        return res.status(404).json({
          success: false,
          error: 'Group purchase not found',
        });
      }

      if (groupPurchase.status !== 'FULL') {
        return res.status(400).json({
          success: false,
          error: 'Group purchase must be full before completing',
        });
      }

      groupPurchase.status = 'COMPLETED';
      groupPurchase.completedAt = new Date();
      await groupPurchase.save();

      res.json({
        success: true,
        data: groupPurchase,
        message: 'Group purchase completed successfully',
      });
    } catch (error) {
      console.error('Complete group purchase error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== REFERRALS =====

// Generate referral code
router.post(
  '/referrals/generate',
  [body('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.body;

      const code = await Referral.getUserReferralCode(userId);

      res.json({
        success: true,
        data: {
          referralCode: code,
        },
      });
    } catch (error) {
      console.error('Generate referral code error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Apply referral code
router.post(
  '/referrals/apply',
  [
    body('referralCode').isString().isLength({ min: 6, max: 6 }),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { referralCode, userId } = req.body;

      const referral = await Referral.applyCode(referralCode, userId);

      res.json({
        success: true,
        data: referral,
        message: 'Referral code applied successfully! You earned a reward.',
      });
    } catch (error) {
      console.error('Apply referral code error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get referral stats
router.get(
  '/referrals/stats/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const stats = await Referral.getUserStats(userId);
      const referralCode = await Referral.getUserReferralCode(userId);

      res.json({
        success: true,
        data: {
          ...stats,
          referralCode,
        },
      });
    } catch (error) {
      console.error('Get referral stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user's referral rewards
router.get(
  '/referrals/rewards/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const rewards = await Referral.find({
        referrerId: userId,
        status: 'REWARDED',
      }).sort({ rewardedAt: -1 });

      res.json({
        success: true,
        data: rewards,
        count: rewards.length,
      });
    } catch (error) {
      console.error('Get referral rewards error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== UTILITY ENDPOINTS =====

// Expire old group purchases (cron job)
router.post('/maintenance/expire-purchases', async (req, res) => {
  try {
    const count = await GroupPurchase.expireOldPurchases();

    res.json({
      success: true,
      message: `Expired ${count} old group purchases`,
      count,
    });
  } catch (error) {
    console.error('Expire purchases error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
