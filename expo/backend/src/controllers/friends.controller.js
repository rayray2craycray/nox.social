const Friendship = require('../models/Friendship.model');

/**
 * Send a friend request
 * POST /api/social/friends/request
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const { addresseeId } = req.body;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!addresseeId) {
      return res.status(400).json({
        success: false,
        error: 'Addressee ID is required',
      });
    }

    if (requesterId === addresseeId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send friend request to yourself',
      });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return res.status(400).json({
          success: false,
          error: 'Already friends',
        });
      } else if (existingFriendship.status === 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Friend request already pending',
        });
      } else if (existingFriendship.status === 'BLOCKED') {
        return res.status(403).json({
          success: false,
          error: 'Cannot send friend request',
        });
      }
    }

    // Create new friend request
    const friendship = await Friendship.create({
      requesterId,
      addresseeId,
      status: 'PENDING',
    });

    res.json({
      success: true,
      data: friendship,
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send friend request',
      message: error.message,
    });
  }
};

/**
 * Accept a friend request
 * POST /api/social/friends/accept/:friendshipId
 */
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found',
      });
    }

    // Verify the user is the addressee
    if (friendship.addresseeId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only accept friend requests sent to you',
      });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Friend request is not pending',
      });
    }

    friendship.status = 'ACCEPTED';
    friendship.respondedAt = new Date();
    await friendship.save();

    res.json({
      success: true,
      data: friendship,
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept friend request',
      message: error.message,
    });
  }
};

/**
 * Reject a friend request
 * POST /api/social/friends/reject/:friendshipId
 */
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found',
      });
    }

    // Verify the user is the addressee
    if (friendship.addresseeId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only reject friend requests sent to you',
      });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Friend request is not pending',
      });
    }

    friendship.status = 'REJECTED';
    friendship.respondedAt = new Date();
    await friendship.save();

    res.json({
      success: true,
      data: friendship,
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject friend request',
      message: error.message,
    });
  }
};

/**
 * Remove a friend
 * DELETE /api/social/friends/:friendshipId
 */
exports.removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({
        success: false,
        error: 'Friendship not found',
      });
    }

    // Verify the user is part of the friendship
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only remove your own friendships',
      });
    }

    await Friendship.findByIdAndDelete(friendshipId);

    res.json({
      success: true,
      message: 'Friend removed successfully',
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend',
      message: error.message,
    });
  }
};

/**
 * Get user's friends
 * GET /api/social/friends
 */
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const friendships = await Friendship.find({
      $or: [
        { requesterId: userId, status: 'ACCEPTED' },
        { addresseeId: userId, status: 'ACCEPTED' },
      ],
    }).sort({ respondedAt: -1 });

    res.json({
      success: true,
      data: friendships,
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends',
      message: error.message,
    });
  }
};

/**
 * Get pending friend requests
 * GET /api/social/friends/requests/pending
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Requests received by the user
    const received = await Friendship.find({
      addresseeId: userId,
      status: 'PENDING',
    }).sort({ requestedAt: -1 });

    // Requests sent by the user
    const sent = await Friendship.find({
      requesterId: userId,
      status: 'PENDING',
    }).sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: {
        received,
        sent,
      },
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending requests',
      message: error.message,
    });
  }
};
