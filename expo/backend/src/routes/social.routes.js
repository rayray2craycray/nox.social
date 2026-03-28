/**
 * Social Routes
 * Endpoints for contact/Instagram sync, crews, and challenges
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Crew = require('../models/Crew');
const Challenge = require('../models/Challenge');
const instagramService = require('../services/instagram.service');

const router = express.Router();

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /social/sync/contacts
 * Sync phone contacts - find users who match hashed phone numbers
 */
router.post(
  '/sync/contacts',
  [
    body('phoneNumbers')
      .isArray({ min: 1 })
      .withMessage('phoneNumbers must be a non-empty array'),
    body('phoneNumbers.*')
      .isString()
      .isLength({ min: 64, max: 64 })
      .withMessage('Each phone hash must be 64 characters (SHA-256)'),
    body('userId')
      .isString()
      .notEmpty()
      .withMessage('userId is required'),
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { phoneNumbers, userId } = req.body;

      console.log(`Contact sync request: ${phoneNumbers.length} hashes from user ${userId}`);

      // Find users with matching phone hashes (excluding current user)
      const matchedUsers = await User.find({
        phoneHash: { $in: phoneNumbers },
        _id: { $ne: userId },
      }).select('phoneHash displayName avatarUrl');

      // Update last sync timestamp
      await User.findByIdAndUpdate(userId, {
        lastSyncedContacts: new Date(),
      });

      // Format response
      const matches = matchedUsers.map(user => ({
        hashedPhone: user.phoneHash,
        userId: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`,
      }));

      console.log(`Found ${matches.length} contact matches`);

      res.json({
        matches,
        totalMatches: matches.length,
      });
    } catch (error) {
      console.error('Contact sync error:', error);
      res.status(500).json({
        error: 'Failed to sync contacts',
        message: error.message,
      });
    }
  }
);

/**
 * POST /social/sync/instagram
 * Sync Instagram following - fetch following list and match with app users
 */
router.post(
  '/sync/instagram',
  [
    body('accessToken')
      .isString()
      .notEmpty()
      .withMessage('accessToken is required'),
    body('userId')
      .isString()
      .notEmpty()
      .withMessage('userId is required'),
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { accessToken, userId } = req.body;

      console.log(`Instagram sync request from user ${userId}`);

      // Get user's Instagram profile to get their Instagram ID
      const profile = await instagramService.getUserProfile(accessToken);

      // Fetch following list from Instagram
      const following = await instagramService.getFollowing(accessToken, profile.id);

      console.log(`Fetched ${following.length} Instagram following`);

      // Extract Instagram IDs and usernames
      const instagramIds = following.map(f => f.id);
      const instagramUsernames = following.map(f => f.username);

      // Find users who match Instagram IDs or usernames (excluding current user)
      const matchedUsers = await User.find({
        $or: [
          { instagramId: { $in: instagramIds } },
          { instagramUsername: { $in: instagramUsernames } },
        ],
        _id: { $ne: userId },
      }).select('instagramId instagramUsername displayName avatarUrl');

      // Update last sync timestamp
      await User.findByIdAndUpdate(userId, {
        lastSyncedInstagram: new Date(),
      });

      // Format response
      const matches = matchedUsers.map(user => ({
        instagramId: user.instagramId,
        instagramUsername: user.instagramUsername,
        userId: user._id.toString(),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`,
      }));

      console.log(`Found ${matches.length} Instagram matches`);

      res.json({
        matches,
        totalMatches: matches.length,
      });
    } catch (error) {
      console.error('Instagram sync error:', error);
      res.status(500).json({
        error: 'Failed to sync Instagram',
        message: error.message,
      });
    }
  }
);

// ===== CREWS =====

// Create crew
router.post(
  '/crews',
  [
    body('name').isString().isLength({ min: 1, max: 50 }),
    body('ownerId').isMongoId(),
    body('description').optional().isString().isLength({ max: 200 }),
    body('isPrivate').optional().isBoolean(),
    body('imageUrl').optional().isURL(),
    body('settings.maxMembers').optional().isInt({ min: 2, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const {
        name,
        ownerId,
        description,
        isPrivate = false,
        imageUrl,
        settings,
        tags,
      } = req.body;

      const crew = await Crew.create({
        name,
        ownerId,
        description,
        isPrivate,
        imageUrl,
        memberIds: [ownerId],
        settings: {
          requireApproval: true,
          maxMembers: settings?.maxMembers || 20,
        },
        tags,
      });

      await crew.populate('ownerId', 'displayName avatarUrl');
      await crew.populate('memberIds', 'displayName avatarUrl');

      res.status(201).json({
        success: true,
        data: crew,
        message: 'Crew created successfully',
      });
    } catch (error) {
      console.error('Create crew error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Search crews (MUST be before /crews/:id)
router.get(
  '/crews/search',
  [
    query('q').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;

      const crews = await Crew.searchCrews(q, parseInt(limit));

      res.json({
        success: true,
        data: crews,
        count: crews.length,
      });
    } catch (error) {
      console.error('Search crews error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get active crews (MUST be before /crews/:id)
router.get('/crews/discover/active', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const crews = await Crew.getActiveCrews(limit);

    res.json({
      success: true,
      data: crews,
      count: crews.length,
    });
  } catch (error) {
    console.error('Get active crews error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user's crews (specific route before :id)
router.get(
  '/crews/user/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const crews = await Crew.getUserCrews(userId);

      res.json({
        success: true,
        data: crews,
        count: crews.length,
      });
    } catch (error) {
      console.error('Get user crews error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get crew by ID (parameterized route comes last)
router.get(
  '/crews/:id',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const crew = await Crew.findById(id)
        .populate('ownerId', 'displayName avatarUrl')
        .populate('memberIds', 'displayName avatarUrl');

      if (!crew) {
        return res.status(404).json({
          success: false,
          error: 'Crew not found',
        });
      }

      res.json({
        success: true,
        data: crew,
      });
    } catch (error) {
      console.error('Get crew error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Add member to crew
router.post(
  '/crews/:id/members',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const crew = await Crew.findById(id);
      if (!crew) {
        return res.status(404).json({
          success: false,
          error: 'Crew not found',
        });
      }

      await crew.addMember(userId);
      await crew.populate('memberIds', 'displayName avatarUrl');

      res.json({
        success: true,
        data: crew,
        message: 'Member added successfully',
      });
    } catch (error) {
      console.error('Add member error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Remove member from crew
router.delete(
  '/crews/:id/members/:userId',
  [
    param('id').isMongoId(),
    param('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id, userId } = req.params;

      const crew = await Crew.findById(id);
      if (!crew) {
        return res.status(404).json({
          success: false,
          error: 'Crew not found',
        });
      }

      await crew.removeMember(userId);
      await crew.populate('memberIds', 'displayName avatarUrl');

      res.json({
        success: true,
        data: crew,
        message: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update crew stats
router.post(
  '/crews/:id/stats',
  [
    param('id').isMongoId(),
    body('nightOut').optional().isBoolean(),
    body('event').optional().isBoolean(),
    body('venueId').optional().isString(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const crew = await Crew.findById(id);
      if (!crew) {
        return res.status(404).json({
          success: false,
          error: 'Crew not found',
        });
      }

      await crew.updateStats(updates);

      res.json({
        success: true,
        data: crew,
        message: 'Stats updated successfully',
      });
    } catch (error) {
      console.error('Update crew stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get crew stats
router.get(
  '/crews/:id/stats',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const stats = await Crew.getCrewStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get crew stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ===== CHALLENGES =====

// Get active challenges
router.get('/challenges/active', async (req, res) => {
  try {
    const { venueId } = req.query;

    const challenges = await Challenge.getActiveChallenges(venueId);

    res.json({
      success: true,
      data: challenges,
      count: challenges.length,
    });
  } catch (error) {
    console.error('Get active challenges error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get challenge by ID
router.get(
  '/challenges/:id',
  [param('id').isMongoId(), validate],
  async (req, res) => {
    try {
      const { id } = req.params;

      const challenge = await Challenge.findById(id);
      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      console.error('Get challenge error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user's challenges
router.get(
  '/challenges/user/:userId',
  [param('userId').isMongoId(), validate],
  async (req, res) => {
    try {
      const { userId } = req.params;

      const challenges = await Challenge.getUserChallenges(userId);

      res.json({
        success: true,
        data: challenges,
        count: challenges.length,
      });
    } catch (error) {
      console.error('Get user challenges error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Join challenge
router.post(
  '/challenges/:id/join',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const challenge = await Challenge.findById(id);
      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }

      await challenge.joinChallenge(userId);

      res.json({
        success: true,
        data: challenge,
        message: 'Successfully joined challenge',
      });
    } catch (error) {
      console.error('Join challenge error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Update challenge progress
router.post(
  '/challenges/:id/progress',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    body('progressIncrement').optional().isInt({ min: 1 }),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, progressIncrement = 1 } = req.body;

      const challenge = await Challenge.findById(id);
      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }

      await challenge.updateProgress(userId, progressIncrement);

      res.json({
        success: true,
        data: challenge,
        message: 'Progress updated successfully',
      });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get user's challenge progress
router.get(
  '/challenges/:id/progress/:userId',
  [
    param('id').isMongoId(),
    param('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id, userId } = req.params;

      const progress = await Challenge.getUserProgress(userId, id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'User has not joined this challenge',
        });
      }

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Claim challenge reward
router.post(
  '/challenges/:id/claim',
  [
    param('id').isMongoId(),
    body('userId').isMongoId(),
    validate,
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const challenge = await Challenge.findById(id);
      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }

      await challenge.claimReward(userId);

      res.json({
        success: true,
        data: challenge,
        message: 'Reward claimed successfully',
      });
    } catch (error) {
      console.error('Claim reward error:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get venue challenge stats
router.get(
  '/challenges/stats/venue/:venueId',
  [param('venueId').notEmpty(), validate],
  async (req, res) => {
    try {
      const { venueId } = req.params;

      const stats = await Challenge.getVenueStats(venueId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get venue challenge stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Deactivate expired challenges (maintenance endpoint)
router.post('/challenges/maintenance/deactivate-expired', async (req, res) => {
  try {
    const count = await Challenge.deactivateExpired();

    res.json({
      success: true,
      message: `Deactivated ${count} expired challenges`,
      count,
    });
  } catch (error) {
    console.error('Deactivate expired challenges error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ===== FRIENDS ROUTES =====

const { authMiddleware } = require('../middleware/auth.middleware');
const friendsController = require('../controllers/friends.controller');
const crewsController = require('../controllers/crews.controller');
const challengesController = require('../controllers/challenges.controller');

// Send friend request
router.post('/friends/request', authMiddleware, friendsController.sendFriendRequest);

// Accept friend request
router.post('/friends/accept/:friendshipId', authMiddleware, friendsController.acceptFriendRequest);

// Reject friend request
router.post('/friends/reject/:friendshipId', authMiddleware, friendsController.rejectFriendRequest);

// Remove friend
router.delete('/friends/:friendshipId', authMiddleware, friendsController.removeFriend);

// Get user's friends
router.get('/friends', authMiddleware, friendsController.getFriends);

// Get pending friend requests
router.get('/friends/requests/pending', authMiddleware, friendsController.getPendingRequests);

// ===== NEW CREWS ROUTES (authenticated) =====

// Join crew (with invite code for private crews)
router.post('/crews/:crewId/join', authMiddleware, crewsController.joinCrew);

// Leave crew
router.post('/crews/:crewId/leave', authMiddleware, crewsController.leaveCrew);

// Update crew (owner only)
router.patch('/crews/:crewId', authMiddleware, crewsController.updateCrew);

// Delete crew (owner only)
router.delete('/crews/:crewId', authMiddleware, crewsController.deleteCrew);

// Get invite code (members only)
router.get('/crews/:crewId/invite', authMiddleware, crewsController.getInviteCode);

// ===== NEW CHALLENGES ROUTES (authenticated) =====

// Join challenge
router.post('/challenges/:challengeId/join', authMiddleware, challengesController.joinChallenge);

// Get user's challenge progress
router.get('/challenges/progress', authMiddleware, challengesController.getUserChallengeProgress);

// Update challenge progress
router.post('/challenges/:challengeId/progress', authMiddleware, challengesController.updateChallengeProgress);

// Claim reward
router.post('/challenges/:challengeId/claim', authMiddleware, challengesController.claimReward);

// Create challenge (admin/venue owner)
router.post('/challenges/create', authMiddleware, challengesController.createChallenge);

module.exports = router;
