/**
 * Spend Rules Controller
 * Manages spend-based tier unlock rules
 */

const SpendRule = require('../models/SpendRule');
const logger = require('../utils/logger');

/**
 * Get spend rules for venue
 * GET /api/pos/rules/:venueId
 */
exports.getRules = async (req, res) => {
  try {
    const { venueId } = req.params;

    const rules = await SpendRule.find({ venueId }).sort({ priority: -1, threshold: 1 });

    res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (error) {
    logger.error('Get spend rules error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get spend rules',
    });
  }
};

/**
 * Create spend rule
 * POST /api/pos/rules/:venueId
 */
exports.createRule = async (req, res) => {
  try {
    const { venueId } = req.params;
    const {
      threshold,
      tierUnlocked,
      serverAccessLevel,
      isLiveOnly,
      liveTimeWindow,
      performerId,
      description,
      priority,
    } = req.body;

    // Validate required fields
    if (!threshold || !tierUnlocked || !serverAccessLevel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: threshold, tierUnlocked, serverAccessLevel',
      });
    }

    // Validate threshold is positive
    if (threshold <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Threshold must be greater than 0',
      });
    }

    // Validate tier
    if (!['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'].includes(tierUnlocked)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be GUEST, REGULAR, PLATINUM, or WHALE',
      });
    }

    // Validate access level
    if (!['PUBLIC_LOBBY', 'INNER_CIRCLE'].includes(serverAccessLevel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid access level. Must be PUBLIC_LOBBY or INNER_CIRCLE',
      });
    }

    // Validate time window if live-only
    if (isLiveOnly && (!liveTimeWindow || !liveTimeWindow.startTime || !liveTimeWindow.endTime)) {
      return res.status(400).json({
        success: false,
        error: 'Live-only rules require liveTimeWindow with startTime and endTime',
      });
    }

    // Create rule
    const rule = new SpendRule({
      venueId,
      threshold: Math.round(threshold * 100), // Convert dollars to cents
      tierUnlocked,
      serverAccessLevel,
      isLiveOnly: isLiveOnly || false,
      liveTimeWindow,
      performerId,
      description,
      priority: priority || 0,
      isActive: true,
    });

    await rule.save();

    logger.info('Spend rule created', {
      venueId,
      ruleId: rule._id,
      threshold,
      tierUnlocked,
    });

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error('Create spend rule error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create spend rule',
      details: error.message,
    });
  }
};

/**
 * Update spend rule
 * PATCH /api/pos/rules/:venueId/:ruleId
 */
exports.updateRule = async (req, res) => {
  try {
    const { venueId, ruleId } = req.params;
    const updates = req.body;

    const rule = await SpendRule.findOne({ _id: ruleId, venueId });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Spend rule not found',
      });
    }

    // Update threshold (convert to cents if provided)
    if (updates.threshold !== undefined) {
      if (updates.threshold <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Threshold must be greater than 0',
        });
      }
      rule.threshold = Math.round(updates.threshold * 100);
    }

    // Update tier
    if (updates.tierUnlocked) {
      if (!['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'].includes(updates.tierUnlocked)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier',
        });
      }
      rule.tierUnlocked = updates.tierUnlocked;
    }

    // Update access level
    if (updates.serverAccessLevel) {
      if (!['PUBLIC_LOBBY', 'INNER_CIRCLE'].includes(updates.serverAccessLevel)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid access level',
        });
      }
      rule.serverAccessLevel = updates.serverAccessLevel;
    }

    // Update other fields
    if (updates.isLiveOnly !== undefined) rule.isLiveOnly = updates.isLiveOnly;
    if (updates.liveTimeWindow) rule.liveTimeWindow = updates.liveTimeWindow;
    if (updates.performerId !== undefined) rule.performerId = updates.performerId;
    if (updates.description !== undefined) rule.description = updates.description;
    if (updates.priority !== undefined) rule.priority = updates.priority;

    await rule.save();

    logger.info('Spend rule updated', { venueId, ruleId: rule._id });

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error('Update spend rule error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update spend rule',
    });
  }
};

/**
 * Delete spend rule
 * DELETE /api/pos/rules/:venueId/:ruleId
 */
exports.deleteRule = async (req, res) => {
  try {
    const { venueId, ruleId } = req.params;

    const rule = await SpendRule.findOneAndDelete({ _id: ruleId, venueId });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Spend rule not found',
      });
    }

    logger.info('Spend rule deleted', { venueId, ruleId });

    res.status(200).json({
      success: true,
      message: 'Spend rule deleted successfully',
    });
  } catch (error) {
    logger.error('Delete spend rule error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete spend rule',
    });
  }
};

/**
 * Toggle spend rule active status
 * POST /api/pos/rules/:venueId/:ruleId/toggle
 */
exports.toggleRule = async (req, res) => {
  try {
    const { venueId, ruleId } = req.params;

    const rule = await SpendRule.findOne({ _id: ruleId, venueId });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Spend rule not found',
      });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    logger.info('Spend rule toggled', { venueId, ruleId, isActive: rule.isActive });

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error('Toggle spend rule error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle spend rule',
    });
  }
};
