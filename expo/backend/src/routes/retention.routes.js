/**
 * Retention Routes
 * API endpoints for streaks, memories, and retention features
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Streak = require('../models/Streak');
const Memory = require('../models/Memory');

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== STREAKS =====

// Get user's streaks
router.get(
  '/streaks/user/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const streaks = await Streak.getUserStreaks(userId);

      res.json({
        success: true,
        data: streaks,
        count: streaks.length,
      });
    } catch (error) {
      console.error('Get user streaks error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Increment streak
router.post(
  '/streaks/:id/increment',
  [
    param('id').isMongoId(),
    body('activityType').isIn(['CHECK_IN', 'TICKET_PURCHASE', 'FRIEND_INVITE', 'VIDEO_UPLOAD', 'CHALLENGE_COMPLETE']),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { activityType } = req.body;

      const streak = await Streak.findById(id);
      if (!streak) {
        return res.status(404).json({
          success: false,
          error: 'Streak not found',
        });
      }

      await streak.incrementStreak(activityType);

      res.json({
        success: true,
        data: streak,
        message: 'Streak updated successfully',
      });
    } catch (error) {
      console.error('Increment streak error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Claim milestone reward
router.post(
  '/streaks/:id/milestones/:milestone/claim',
  [
    param('id').isMongoId(),
    param('milestone').isInt({ min: 1 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { id, milestone } = req.params;

      const streak = await Streak.findById(id);
      if (!streak) {
        return res.status(404).json({
          success: false,
          error: 'Streak not found',
        });
      }

      await streak.claimMilestone(parseInt(milestone));

      res.json({
        success: true,
        data: streak,
        message: 'Milestone reward claimed successfully',
      });
    } catch (error) {
      console.error('Claim milestone error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get streak leaderboard
router.get(
  '/streaks/leaderboard/:type',
  [
    param('type').isIn(['WEEKEND_WARRIOR', 'VENUE_LOYALTY', 'SOCIAL_BUTTERFLY', 'EVENT_GOER', 'DAILY_CHECK_IN']),
    query('venueId').optional().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { type } = req.params;
      const { venueId, limit = 50 } = req.query;

      const leaderboard = await Streak.getLeaderboard(type, venueId, parseInt(limit));

      res.json({
        success: true,
        data: leaderboard,
        count: leaderboard.length,
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get at-risk streaks
router.get('/streaks/at-risk', async (req, res) => {
  try {
    const atRiskStreaks = await Streak.getAtRiskStreaks();

    res.json({
      success: true,
      data: atRiskStreaks,
      count: atRiskStreaks.length,
    });
  } catch (error) {
    console.error('Get at-risk streaks error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get streak stats
router.get(
  '/streaks/stats',
  [
    query('userId').optional().isMongoId(),
    query('type').optional().isIn(['WEEKEND_WARRIOR', 'VENUE_LOYALTY', 'SOCIAL_BUTTERFLY', 'EVENT_GOER', 'DAILY_CHECK_IN']),
    query('venueId').optional().notEmpty(),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId, type, venueId } = req.query;

      const stats = await Streak.getStats(userId, type, venueId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get streak stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== MEMORIES =====

// Create memory
router.post(
  '/memories',
  [
    body('userId').isMongoId(),
    body('venueId').notEmpty(),
    body('date').isISO8601(),
    body('type').isIn(['CHECK_IN', 'VIDEO', 'PHOTO', 'MILESTONE', 'ACHIEVEMENT', 'SPECIAL_MOMENT']),
    body('content').isObject(),
    body('eventId').optional().isMongoId(),
    body('friendsTagged').optional().isArray(),
    body('isPrivate').optional().isBoolean(),
    body('mood').optional().isIn(['AMAZING', 'GREAT', 'GOOD', 'OKAY', 'MEH']),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        userId,
        venueId,
        eventId,
        date,
        type,
        content,
        friendsTagged,
        isPrivate = false,
        tags,
        mood,
        rating,
      } = req.body;

      const memory = await Memory.create({
        userId,
        venueId,
        eventId,
        date,
        type,
        content,
        friendsTagged,
        isPrivate,
        tags,
        mood,
        rating,
      });

      await memory.populate('eventId', 'title date');
      await memory.populate('friendsTagged', 'displayName avatarUrl');

      res.status(201).json({
        success: true,
        data: memory,
        message: 'Memory created successfully',
      });
    } catch (error) {
      console.error('Create memory error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user's timeline
router.get(
  '/memories/timeline/:userId',
  [
    param('userId').isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('venueId').optional().notEmpty(),
    query('type').optional().isIn(['CHECK_IN', 'VIDEO', 'PHOTO', 'MILESTONE', 'ACHIEVEMENT', 'SPECIAL_MOMENT']),
    query('includePrivate').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const options = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        venueId: req.query.venueId,
        type: req.query.type,
        includePrivate: req.query.includePrivate === 'true',
        limit: parseInt(req.query.limit) || 50,
        skip: parseInt(req.query.skip) || 0,
      };

      const timeline = await Memory.getUserTimeline(userId, options);

      res.json({
        success: true,
        data: timeline,
        count: timeline.length,
      });
    } catch (error) {
      console.error('Get timeline error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get venue memories
router.get(
  '/memories/venue/:venueId',
  [
    param('venueId').notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const options = {
        limit: parseInt(req.query.limit) || 50,
        skip: parseInt(req.query.skip) || 0,
      };

      const memories = await Memory.getVenueMemories(venueId, options);

      res.json({
        success: true,
        data: memories,
        count: memories.length,
      });
    } catch (error) {
      console.error('Get venue memories error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get tagged memories
router.get(
  '/memories/tagged/:userId',
  [
    param('userId').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('skip').optional().isInt({ min: 0 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const options = {
        limit: parseInt(req.query.limit) || 50,
        skip: parseInt(req.query.skip) || 0,
      };

      const memories = await Memory.getTaggedMemories(userId, options);

      res.json({
        success: true,
        data: memories,
        count: memories.length,
      });
    } catch (error) {
      console.error('Get tagged memories error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get "On This Day" memories
router.get(
  '/memories/on-this-day/:userId',
  [
    param('userId').isMongoId(),
    query('monthDay').isString().matches(/^\d{2}-\d{2}$/),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { monthDay } = req.query;

      const memories = await Memory.getOnThisDay(userId, monthDay);

      res.json({
        success: true,
        data: memories,
        count: memories.length,
      });
    } catch (error) {
      console.error('Get on this day memories error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get memory highlights
router.get(
  '/memories/highlights/:userId',
  [
    param('userId').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const options = {
        limit: parseInt(req.query.limit) || 10,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const highlights = await Memory.getHighlights(userId, options);

      res.json({
        success: true,
        data: highlights,
        count: highlights.length,
      });
    } catch (error) {
      console.error('Get highlights error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Like memory
router.post(
  '/memories/:id/like',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const memory = await Memory.findById(id);
      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found',
        });
      }

      await memory.addLike(userId);

      res.json({
        success: true,
        data: { likes: memory.likes },
        message: 'Memory liked successfully',
      });
    } catch (error) {
      console.error('Like memory error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Unlike memory
router.post(
  '/memories/:id/unlike',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const memory = await Memory.findById(id);
      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found',
        });
      }

      await memory.removeLike(userId);

      res.json({
        success: true,
        data: { likes: memory.likes },
        message: 'Memory unliked successfully',
      });
    } catch (error) {
      console.error('Unlike memory error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Add comment to memory
router.post(
  '/memories/:id/comments',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    body('text').isString().isLength({ min: 1, max: 500 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, text } = req.body;

      const memory = await Memory.findById(id);
      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found',
        });
      }

      await memory.addComment(userId, text);
      await memory.populate('comments.userId', 'displayName avatarUrl');

      res.status(201).json({
        success: true,
        data: memory.comments[memory.comments.length - 1],
        message: 'Comment added successfully',
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Delete comment from memory
router.delete(
  '/memories/:id/comments/:commentId',
  [
    param('id').isMongoId(),
    param('commentId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id, commentId } = req.params;

      const memory = await Memory.findById(id);
      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found',
        });
      }

      await memory.removeComment(commentId);

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get memory stats
router.get(
  '/memories/stats',
  [
    query('userId').optional().isMongoId(),
    query('venueId').optional().notEmpty(),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId, venueId } = req.query;

      const stats = await Memory.getStats(userId, venueId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get memory stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== MAINTENANCE ENDPOINTS =====

// Break expired streaks (cron job)
router.post('/maintenance/break-expired-streaks', async (req, res) => {
  try {
    const count = await Streak.breakExpiredStreaks();

    res.json({
      success: true,
      message: `Broke ${count} expired streaks`,
      count,
    });
  } catch (error) {
    console.error('Break expired streaks error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
