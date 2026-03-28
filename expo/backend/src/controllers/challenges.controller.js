const Challenge = require('../models/Challenge');
const ChallengeProgress = require('../models/ChallengeProgress.model');

/**
 * Get active challenges
 * GET /api/social/challenges/active
 */
exports.getActiveChallenges = async (req, res) => {
  try {
    const { venueId, type } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (venueId) {
      query.venueId = venueId;
    }

    if (type) {
      query.type = type;
    }

    const challenges = await Challenge.find(query).sort({ startDate: -1 });

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error('Get active challenges error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get challenges',
      message: error.message,
    });
  }
};

/**
 * Get challenge by ID
 * GET /api/social/challenges/:challengeId
 */
exports.getChallengeById = async (req, res) => {
  try {
    const { challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId);

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
      error: 'Failed to get challenge',
      message: error.message,
    });
  }
};

/**
 * Join a challenge
 * POST /api/social/challenges/:challengeId/join
 */
exports.joinChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
      });
    }

    if (!challenge.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Challenge is not active',
      });
    }

    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      return res.status(400).json({
        success: false,
        error: 'Challenge is not currently available',
      });
    }

    // Check if already joined
    const existingProgress = await ChallengeProgress.findOne({
      userId,
      challengeId,
    });

    if (existingProgress) {
      return res.status(400).json({
        success: false,
        error: 'Already joined this challenge',
      });
    }

    // Create progress record
    const progress = await ChallengeProgress.create({
      userId,
      challengeId,
      currentProgress: 0,
      status: 'IN_PROGRESS',
    });

    // Increment participant count
    await Challenge.findByIdAndUpdate(challengeId, {
      $inc: { participantCount: 1 },
    });

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join challenge',
      message: error.message,
    });
  }
};

/**
 * Get user's challenge progress
 * GET /api/social/challenges/progress
 */
exports.getUserChallengeProgress = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const progressRecords = await ChallengeProgress.find(query)
      .populate('challengeId')
      .sort({ startedAt: -1 });

    res.json({
      success: true,
      data: progressRecords,
    });
  } catch (error) {
    console.error('Get user challenge progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get challenge progress',
      message: error.message,
    });
  }
};

/**
 * Update challenge progress
 * POST /api/social/challenges/:challengeId/progress
 */
exports.updateChallengeProgress = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { amount, note } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid progress amount is required',
      });
    }

    const progress = await ChallengeProgress.findOne({
      userId,
      challengeId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Challenge progress not found. Please join the challenge first.',
      });
    }

    if (progress.status === 'COMPLETED' || progress.status === 'CLAIMED') {
      return res.status(400).json({
        success: false,
        error: 'Challenge already completed',
      });
    }

    // Update progress using the model method
    await progress.updateProgress(amount, note);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Update challenge progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update challenge progress',
      message: error.message,
    });
  }
};

/**
 * Claim challenge reward
 * POST /api/social/challenges/:challengeId/claim
 */
exports.claimReward = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const progress = await ChallengeProgress.findOne({
      userId,
      challengeId,
    }).populate('challengeId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Challenge progress not found',
      });
    }

    if (progress.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Challenge not completed yet',
      });
    }

    if (progress.status === 'CLAIMED') {
      return res.status(400).json({
        success: false,
        error: 'Reward already claimed',
      });
    }

    progress.status = 'CLAIMED';
    progress.claimedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      data: {
        progress,
        reward: progress.challengeId.reward,
      },
    });
  } catch (error) {
    console.error('Claim reward error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim reward',
      message: error.message,
    });
  }
};

/**
 * Create a challenge (admin/venue owner)
 * POST /api/social/challenges
 */
exports.createChallenge = async (req, res) => {
  try {
    const {
      venueId,
      type,
      title,
      description,
      requirements,
      reward,
      startDate,
      endDate,
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // TODO: Verify user is admin or venue owner

    if (!type || !title || !description || !requirements || !reward || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const challenge = await Challenge.create({
      venueId,
      type,
      title,
      description,
      requirements,
      reward,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    });

    res.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create challenge',
      message: error.message,
    });
  }
};
