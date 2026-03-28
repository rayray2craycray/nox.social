/**
 * Content Routes
 * API endpoints for performers, highlights, and content discovery
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Performer = require('../models/Performer');
const HighlightVideo = require('../models/HighlightVideo');

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ===== PERFORMERS =====

// Search performers
router.get(
  '/performers/search',
  [
    query('q').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;

      const performers = await Performer.searchPerformers(q, parseInt(limit));

      res.json({
        success: true,
        data: performers,
        count: performers.length,
      });
    } catch (error) {
      console.error('Search performers error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get performers by genre
router.get(
  '/performers/genre/:genre',
  [
    param('genre').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { genre } = req.params;
      const { limit = 20 } = req.query;

      const performers = await Performer.getByGenre(genre, parseInt(limit));

      res.json({
        success: true,
        data: performers,
        count: performers.length,
      });
    } catch (error) {
      console.error('Get performers by genre error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get trending performers
router.get('/performers/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const performers = await Performer.getTrending(limit);

    res.json({
      success: true,
      data: performers,
      count: performers.length,
    });
  } catch (error) {
    console.error('Get trending performers error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get performer by ID
router.get(
  '/performers/:id',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const performer = await Performer.findById(id)
        .populate('upcomingGigs')
        .populate('pastGigs');

      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      res.json({
        success: true,
        data: performer,
      });
    } catch (error) {
      console.error('Get performer error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Follow performer
router.post(
  '/performers/:id/follow',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const performer = await Performer.findById(id);
      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      await performer.addFollower(userId);

      res.json({
        success: true,
        data: performer,
        message: 'Successfully followed performer',
      });
    } catch (error) {
      console.error('Follow performer error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Unfollow performer
router.post(
  '/performers/:id/unfollow',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const performer = await Performer.findById(id);
      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      await performer.removeFollower(userId);

      res.json({
        success: true,
        data: performer,
        message: 'Successfully unfollowed performer',
      });
    } catch (error) {
      console.error('Unfollow performer error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Create performer post
router.post(
  '/performers/:id/posts',
  [
    param('id').isMongoId(),
    body('type').isIn(['GIG_ANNOUNCEMENT', 'BEHIND_SCENES', 'TRACK_DROP', 'GENERAL']),
    body('content').isObject(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const postData = req.body;

      const performer = await Performer.findById(id);
      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      await performer.createPost(postData);

      res.status(201).json({
        success: true,
        data: performer.posts[0],
        message: 'Post created successfully',
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get performer feed for user
router.get(
  '/performers/feed/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const feed = await Performer.getFeedForUser(userId);

      res.json({
        success: true,
        data: feed,
        count: feed.length,
      });
    } catch (error) {
      console.error('Get performer feed error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Like performer post
router.post(
  '/performers/:id/posts/:postId/like',
  [
    param('id').isMongoId(),
    param('postId').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id, postId } = req.params;
      const { userId } = req.body;

      const performer = await Performer.findById(id);
      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      await performer.likePost(postId, userId);

      res.json({
        success: true,
        message: 'Post liked successfully',
      });
    } catch (error) {
      console.error('Like post error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Unlike performer post
router.post(
  '/performers/:id/posts/:postId/unlike',
  [
    param('id').isMongoId(),
    param('postId').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id, postId } = req.params;
      const { userId } = req.body;

      const performer = await Performer.findById(id);
      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      await performer.unlikePost(postId, userId);

      res.json({
        success: true,
        message: 'Post unliked successfully',
      });
    } catch (error) {
      console.error('Unlike post error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Rate performer
router.post(
  '/performers/:id/rate',
  [
    param('id').isMongoId(),
    body('rating').isInt({ min: 1, max: 5 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      const performer = await Performer.findById(id);
      if (!performer) {
        return res.status(404).json({
          success: false,
          error: 'Performer not found',
        });
      }

      await performer.addRating(rating);

      res.json({
        success: true,
        data: {
          averageRating: performer.averageRating,
          ratingCount: performer.stats.ratingCount,
        },
        message: 'Rating submitted successfully',
      });
    } catch (error) {
      console.error('Rate performer error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== HIGHLIGHTS =====

// Upload highlight video
router.post(
  '/highlights',
  [
    body('videoUrl').isURL(),
    body('thumbnailUrl').isURL(),
    body('venueId').notEmpty(),
    body('userId').isMongoId(),
    body('duration').isInt({ min: 1, max: 15 }),
    body('eventId').optional().isMongoId(),
    body('caption').optional().isString().isLength({ max: 200 }),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        videoUrl,
        thumbnailUrl,
        venueId,
        eventId,
        userId,
        duration,
        caption,
        tags,
      } = req.body;

      const highlight = await HighlightVideo.create({
        videoUrl,
        thumbnailUrl,
        venueId,
        eventId,
        userId,
        duration,
        caption,
        tags,
      });

      await highlight.populate('userId', 'displayName avatarUrl');
      if (eventId) {
        await highlight.populate('eventId', 'title date');
      }

      res.status(201).json({
        success: true,
        data: highlight,
        message: 'Highlight uploaded successfully',
      });
    } catch (error) {
      console.error('Upload highlight error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get venue highlights
router.get(
  '/highlights/venue/:venueId',
  [
    param('venueId').notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { venueId } = req.params;
      const { limit = 20 } = req.query;

      const highlights = await HighlightVideo.getVenueHighlights(venueId, parseInt(limit));

      res.json({
        success: true,
        data: highlights,
        count: highlights.length,
      });
    } catch (error) {
      console.error('Get venue highlights error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get event highlights
router.get(
  '/highlights/event/:eventId',
  [
    param('eventId').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { limit = 20 } = req.query;

      const highlights = await HighlightVideo.getEventHighlights(eventId, parseInt(limit));

      res.json({
        success: true,
        data: highlights,
        count: highlights.length,
      });
    } catch (error) {
      console.error('Get event highlights error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user highlights
router.get(
  '/highlights/user/:userId',
  [
    param('userId').isMongoId(),
    query('includeExpired').optional().isBoolean(),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { includeExpired = false } = req.query;

      const highlights = await HighlightVideo.getUserHighlights(userId, includeExpired === 'true');

      res.json({
        success: true,
        data: highlights,
        count: highlights.length,
      });
    } catch (error) {
      console.error('Get user highlights error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get trending highlights
router.get('/highlights/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const highlights = await HighlightVideo.getTrending(limit);

    res.json({
      success: true,
      data: highlights,
      count: highlights.length,
    });
  } catch (error) {
    console.error('Get trending highlights error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get highlight feed for user
router.get(
  '/highlights/feed/:userId',
  [
    param('userId').isMongoId(),
    body('followedUserIds').optional().isArray(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { followedUserIds = [] } = req.body;
      const { limit = 30 } = req.query;

      const highlights = await HighlightVideo.getFeedForUser(userId, followedUserIds, parseInt(limit));

      res.json({
        success: true,
        data: highlights,
        count: highlights.length,
      });
    } catch (error) {
      console.error('Get highlight feed error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Increment highlight view
router.post(
  '/highlights/:id/view',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const highlight = await HighlightVideo.findById(id);
      if (!highlight) {
        return res.status(404).json({
          success: false,
          error: 'Highlight not found',
        });
      }

      await highlight.incrementView();

      res.json({
        success: true,
        data: { views: highlight.views },
      });
    } catch (error) {
      console.error('Increment view error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Like highlight
router.post(
  '/highlights/:id/like',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const highlight = await HighlightVideo.findById(id);
      if (!highlight) {
        return res.status(404).json({
          success: false,
          error: 'Highlight not found',
        });
      }

      await highlight.like(userId);

      res.json({
        success: true,
        data: { likes: highlight.likes },
        message: 'Highlight liked successfully',
      });
    } catch (error) {
      console.error('Like highlight error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Unlike highlight
router.post(
  '/highlights/:id/unlike',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const highlight = await HighlightVideo.findById(id);
      if (!highlight) {
        return res.status(404).json({
          success: false,
          error: 'Highlight not found',
        });
      }

      await highlight.unlike(userId);

      res.json({
        success: true,
        data: { likes: highlight.likes },
        message: 'Highlight unliked successfully',
      });
    } catch (error) {
      console.error('Unlike highlight error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get highlight stats
router.get(
  '/highlights/stats',
  [
    query('venueId').optional().notEmpty(),
    query('eventId').optional().isMongoId(),
    query('userId').optional().isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { venueId, eventId, userId } = req.query;

      const stats = await HighlightVideo.getStats(venueId, eventId, userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get highlight stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Expire old highlights (maintenance endpoint)
router.post('/highlights/maintenance/expire-old', async (req, res) => {
  try {
    const count = await HighlightVideo.expireOldHighlights();

    res.json({
      success: true,
      message: `Expired ${count} old highlights`,
      count,
    });
  } catch (error) {
    console.error('Expire highlights error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete expired highlights (maintenance endpoint)
router.post('/highlights/maintenance/delete-expired', async (req, res) => {
  try {
    const olderThanDays = parseInt(req.query.olderThanDays) || 7;
    const count = await HighlightVideo.deleteExpiredHighlights(olderThanDays);

    res.json({
      success: true,
      message: `Deleted ${count} expired highlights older than ${olderThanDays} days`,
      count,
    });
  } catch (error) {
    console.error('Delete expired highlights error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
