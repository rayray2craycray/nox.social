const Message = require('../models/Message.model');
const ChannelRead = require('../models/ChannelRead');

/**
 * Mark a channel as read for the current user (sets lastReadAt = now).
 * POST /api/chat/channels/:channelId/read
 */
exports.markChannelRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { channelId } = req.params;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!channelId) return res.status(400).json({ success: false, error: 'channelId required' });

    await ChannelRead.findOneAndUpdate(
      { userId, channelId },
      { $set: { lastReadAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('[markChannelRead] error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to mark read' });
  }
};

/**
 * Unread message counts for a set of channels, for the current user.
 * A message is unread if it's newer than the user's lastReadAt for that channel
 * and wasn't sent by the user. Channels never read count all others' messages.
 * POST /api/chat/unread-counts  { channelIds: string[] }  → { counts: {id:n} }
 */
exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const channelIds = Array.isArray(req.body?.channelIds) ? req.body.channelIds.slice(0, 200) : [];
    if (channelIds.length === 0) return res.json({ success: true, counts: {} });

    const reads = await ChannelRead.find({ userId, channelId: { $in: channelIds } });
    const lastReadByChannel = new Map(reads.map((r) => [r.channelId, r.lastReadAt]));

    // One aggregate pass: count messages per channel that are newer than this
    // user's read cursor (or all, if never read) and not authored by the user.
    const counts = {};
    await Promise.all(
      channelIds.map(async (channelId) => {
        const q = { channelId, userId: { $ne: userId } };
        const lastRead = lastReadByChannel.get(channelId);
        if (lastRead) q.timestamp = { $gt: lastRead };
        counts[channelId] = await Message.countDocuments(q);
      })
    );
    return res.json({ success: true, counts });
  } catch (error) {
    console.error('[getUnreadCounts] error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to load unread counts' });
  }
};

/**
 * Get messages for a channel
 * GET /api/chat/channels/:channelId/messages
 */
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    const query = {
      channelId,
      deleted: false,
    };

    // Pagination: get messages before a specific timestamp
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message,
    });
  }
};

/**
 * Send a message (HTTP endpoint - also handled by Socket.io)
 * POST /api/chat/channels/:channelId/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, replyTo } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long (max 2000 characters)',
      });
    }

    // Get user info (you'd fetch this from User model in production)
    const userName = req.user?.email?.split('@')[0] || 'User';
    const userBadge = 'GUEST'; // TODO: Fetch actual badge from user profile

    const message = await Message.create({
      channelId,
      userId,
      userName,
      userBadge,
      content: content.trim(),
      replyTo,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message,
    });
  }
};

/**
 * Edit a message
 * PATCH /api/chat/messages/:messageId
 */
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    if (message.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages',
      });
    }

    message.content = content.trim();
    message.edited = true;
    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit message',
      message: error.message,
    });
  }
};

/**
 * Delete a message (soft delete)
 * DELETE /api/chat/messages/:messageId
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    if (message.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages',
      });
    }

    message.deleted = true;
    message.content = '[Message deleted]';
    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
      message: error.message,
    });
  }
};

/**
 * Add reaction to a message
 * POST /api/chat/messages/:messageId/reactions
 */
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Find or create reaction
    const existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      // Toggle reaction
      if (existingReaction.userIds.includes(userId)) {
        existingReaction.userIds = existingReaction.userIds.filter(
          (id) => id !== userId
        );
      } else {
        existingReaction.userIds.push(userId);
      }
    } else {
      message.reactions.push({
        emoji,
        userIds: [userId],
      });
    }

    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction',
      message: error.message,
    });
  }
};
