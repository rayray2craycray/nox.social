/**
 * Moderation Controller
 * Handles content reports, user blocking, and moderation actions
 */

const Report = require('../models/Report');
const BlockedUser = require('../models/BlockedUser');
const logger = require('../utils/logger');

/**
 * Submit a report
 * POST /api/moderation/reports
 */
exports.submitReport = async (req, res) => {
  try {
    const { contentType, contentId, reason, details, reportedUserId } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!contentType || !contentId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contentType, contentId, reason',
      });
    }

    // Validate content type
    if (!['video', 'user', 'comment', 'message'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type',
      });
    }

    // Check if user has already reported this content
    const existingReport = await Report.findOne({
      reporterId,
      contentType,
      contentId,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this content',
      });
    }

    // Create report
    const report = new Report({
      reporterId,
      contentType,
      contentId,
      reason,
      details: details ? details.trim() : undefined,
      reportedUserId,
      reporterIP: req.ip,
      // Set higher priority for severe violations
      priority: ['hate_speech', 'harassment', 'dangerous', 'underage'].includes(reason) ? 10 : 0,
    });

    await report.save();

    logger.info('Report submitted', {
      reportId: report._id,
      reporterId,
      contentType,
      contentId,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our moderation team will review within 24 hours.',
      data: {
        reportId: report._id,
      },
    });
  } catch (error) {
    logger.error('Submit report error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to submit report',
    });
  }
};

/**
 * Get user's submitted reports
 * GET /api/moderation/reports/my
 */
exports.getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const reports = await Report.find({ reporterId: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-reporterIP -moderatorNotes');

    const total = await Report.countDocuments({ reporterId: userId });

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get my reports error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports',
    });
  }
};

/**
 * Block a user
 * POST /api/moderation/block
 */
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const blockerId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId',
      });
    }

    // Prevent self-blocking
    if (userId === blockerId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot block yourself',
      });
    }

    // Check if already blocked
    const existingBlock = await BlockedUser.findOne({
      blockerId,
      blockedUserId: userId,
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        error: 'You have already blocked this user',
      });
    }

    // Create block
    const block = new BlockedUser({
      blockerId,
      blockedUserId: userId,
    });

    await block.save();

    // TODO: Remove existing follows, pending messages, etc.

    logger.info('User blocked', {
      blockerId,
      blockedUserId: userId,
    });

    res.status(201).json({
      success: true,
      message: 'User blocked successfully',
      data: {
        blockId: block._id,
      },
    });
  } catch (error) {
    logger.error('Block user error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to block user',
    });
  }
};

/**
 * Unblock a user
 * DELETE /api/moderation/block/:userId
 */
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    const block = await BlockedUser.findOneAndDelete({
      blockerId,
      blockedUserId: userId,
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Block not found',
      });
    }

    logger.info('User unblocked', {
      blockerId,
      blockedUserId: userId,
    });

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    logger.error('Unblock user error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user',
    });
  }
};

/**
 * Get list of blocked users
 * GET /api/moderation/blocked
 */
exports.getBlockedUsers = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const blocks = await BlockedUser.find({ blockerId })
      .populate('blockedUserId', 'username displayName profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await BlockedUser.countDocuments({ blockerId });

    res.status(200).json({
      success: true,
      data: blocks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get blocked users error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blocked users',
    });
  }
};

/**
 * Check if a user is blocked
 * GET /api/moderation/blocked/check/:userId
 */
exports.checkIfBlocked = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const isBlocked = await BlockedUser.isEitherBlocked(currentUserId, userId);

    res.status(200).json({
      success: true,
      data: {
        isBlocked,
      },
    });
  } catch (error) {
    logger.error('Check if blocked error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check block status',
    });
  }
};

// ============================================================================
// ADMIN/MODERATOR ENDPOINTS
// ============================================================================

/**
 * Get moderation queue
 * GET /api/moderation/queue
 * Auth: Moderator/Admin only
 */
exports.getModerationQueue = async (req, res) => {
  try {
    const {
      status = 'PENDING',
      contentType,
      limit = 50,
      offset = 0,
    } = req.query;

    const query = { status };
    if (contentType) {
      query.contentType = contentType;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'username displayName')
      .populate('reportedUserId', 'username displayName')
      .sort({ priority: -1, createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get moderation queue error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve moderation queue',
    });
  }
};

/**
 * Update report status
 * PATCH /api/moderation/reports/:reportId
 * Auth: Moderator/Admin only
 */
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, moderationAction, moderatorNotes } = req.body;
    const moderatorId = req.user.id;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    // Update fields
    if (status) report.status = status;
    if (moderationAction) report.moderationAction = moderationAction;
    if (moderatorNotes) report.moderatorNotes = moderatorNotes;

    report.moderatorId = moderatorId;
    report.reviewedAt = new Date();

    await report.save();

    logger.info('Report updated', {
      reportId,
      moderatorId,
      status,
      moderationAction,
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Update report error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
    });
  }
};

/**
 * Get moderation statistics
 * GET /api/moderation/stats
 * Auth: Admin only
 */
exports.getModerationStats = async (req, res) => {
  try {
    const [
      totalReports,
      pendingReports,
      reviewingReports,
      resolvedReports,
      totalBlocks,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'PENDING' }),
      Report.countDocuments({ status: 'REVIEWING' }),
      Report.countDocuments({ status: 'RESOLVED' }),
      BlockedUser.countDocuments(),
    ]);

    // Reports by content type
    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$contentType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Reports by reason
    const reportsByReason = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalReports,
        pending: pendingReports,
        reviewing: reviewingReports,
        resolved: resolvedReports,
        totalBlocks,
        byContentType: reportsByType,
        byReason: reportsByReason,
      },
    });
  } catch (error) {
    logger.error('Get moderation stats error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve moderation statistics',
    });
  }
};
