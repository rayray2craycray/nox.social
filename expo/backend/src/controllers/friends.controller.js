const Friendship = require('../models/Friendship.model');
const User = require('../models/User');

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

    // Resolve each friendship edge to the OTHER user's public profile, so the
    // client gets usable friends (name + avatar), not raw edge records.
    const me = String(userId);
    const otherIds = friendships.map((f) =>
      String(f.requesterId) === me ? f.addresseeId : f.requesterId
    );
    const users = await User.find({ _id: { $in: otherIds } }).select(
      'displayName avatarUrl profileImageUrl bio instagramUsername isIncognito'
    );
    const byId = new Map(users.map((u) => [String(u._id), u]));

    const friends = friendships
      .map((f) => {
        const otherId = String(f.requesterId) === me ? f.addresseeId : f.requesterId;
        const u = byId.get(String(otherId));
        if (!u) return null;
        return {
          id: u._id.toString(),
          friendshipId: f._id.toString(),
          displayName: u.displayName,
          avatarUrl: u.avatarUrl || u.profileImageUrl || null,
          bio: u.bio || null,
          instagramUsername: u.instagramUsername || null,
          isIncognito: !!u.isIncognito,
          since: f.respondedAt || f.updatedAt || f.createdAt,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: friends,
      friends, // convenience alias so clients can read either data or friends
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
 * One-tap follow — the app's social model is a directional "follow", but for
 * v1 we model it as an immediately-ACCEPTED friendship (no pending-request UX).
 * Idempotent: following someone you already follow is a no-op success.
 * POST /api/social/follow/:userId
 */
exports.followUser = async (req, res) => {
  try {
    const me = req.user?.userId;
    const target = req.params.userId;
    if (!me) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!target || target === me) {
      return res.status(400).json({ success: false, error: 'Invalid user to follow' });
    }
    const targetUser = await User.findById(target).select('_id');
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    // Reuse an existing edge in either direction; otherwise create one.
    let edge = await Friendship.findOne({
      $or: [
        { requesterId: me, addresseeId: target },
        { requesterId: target, addresseeId: me },
      ],
    });
    if (edge) {
      if (edge.status !== 'ACCEPTED') {
        edge.status = 'ACCEPTED';
        edge.respondedAt = new Date();
        await edge.save();
      }
    } else {
      edge = await Friendship.create({
        requesterId: me,
        addresseeId: target,
        status: 'ACCEPTED',
        respondedAt: new Date(),
      });
    }
    return res.status(200).json({ success: true, data: { friendshipId: edge._id.toString() } });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(200).json({ success: true, data: { alreadyFollowing: true } });
    }
    console.error('Follow user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to follow user' });
  }
};

/**
 * Unfollow — removes the friendship edge in either direction.
 * DELETE /api/social/follow/:userId
 */
exports.unfollowUser = async (req, res) => {
  try {
    const me = req.user?.userId;
    const target = req.params.userId;
    if (!me) return res.status(401).json({ success: false, error: 'Unauthorized' });
    await Friendship.deleteMany({
      $or: [
        { requesterId: me, addresseeId: target },
        { requesterId: target, addresseeId: me },
      ],
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to unfollow user' });
  }
};

/**
 * Search users by display name — powers "add friends".
 * GET /api/social/users/search?q=&limit=
 */
exports.searchUsers = async (req, res) => {
  try {
    const me = req.user?.userId;
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    if (q.length < 2) {
      return res.json({ success: true, data: [], users: [] });
    }
    // Case-insensitive prefix/substring match on displayName. Excludes self.
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      _id: { $ne: me },
      displayName: { $regex: safe, $options: 'i' },
    })
      .select('displayName avatarUrl profileImageUrl bio instagramUsername isIncognito')
      .limit(limit);

    const results = users.map((u) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      avatarUrl: u.avatarUrl || u.profileImageUrl || null,
      bio: u.bio || null,
      instagramUsername: u.instagramUsername || null,
      isIncognito: !!u.isIncognito,
    }));
    return res.json({ success: true, data: results, users: results });
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to search users' });
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
