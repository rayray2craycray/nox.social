/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 */

const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Friendship = require('../models/Friendship.model');
const BlockedUser = require('../models/BlockedUser');
const CheckIn = require('../models/CheckIn');
const emailService = require('../services/email.service');
const {
  generateAccessToken,
  generateRefreshToken,
  getExpiresIn,
  getExpiryDate,
} = require('../utils/jwt.utils');

/**
 * Sign Up - Register a new user
 * POST /api/auth/signup
 */
const signUp = async (req, res) => {
  try {
    const { email, password, displayName, phoneNumber, dateOfBirth } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email, password, and display name are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already in use',
        message: 'An account with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const refreshTokenString = generateRefreshToken();

    // Save refresh token to database
    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenString,
      expiresAt: getExpiryDate('refresh'),
    });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Return user data (without password)
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn: getExpiresIn('access'),
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Sign up error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: messages.join(', '),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to create account',
    });
  }
};

/**
 * Sign In - Authenticate existing user
 * POST /api/auth/signin
 */
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required',
      });
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const refreshTokenString = generateRefreshToken();

    // Save refresh token to database
    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenString,
      expiresAt: getExpiryDate('refresh'),
    });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Return user data
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          phoneNumber: user.phoneNumber,
          dateOfBirth: user.dateOfBirth,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn: getExpiresIn('access'),
      },
      message: 'Signed in successfully',
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to sign in',
    });
  }
};

/**
 * Refresh Token - Get new access token using refresh token
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refresh token',
        message: 'Refresh token is required',
      });
    }

    // Find refresh token in database
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      isRevoked: false,
    });

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token not found or revoked',
      });
    }

    // Check if token is expired
    if (tokenDoc.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Expired refresh token',
        message: 'Refresh token has expired',
      });
    }

    // Get user
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });

    const newRefreshToken = generateRefreshToken();

    // Revoke old refresh token
    tokenDoc.isRevoked = true;
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    // Save new refresh token
    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt: getExpiryDate('refresh'),
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: getExpiresIn('access'),
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to refresh token',
    });
  }
};

/**
 * Sign Out - Revoke refresh token
 * POST /api/auth/signout
 */
const signOut = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke refresh token
      await RefreshToken.updateOne(
        { token: refreshToken },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to sign out',
    });
  }
};

/**
 * Serialize badge subdocuments to the frontend UserBadge shape.
 */
function serializeBadges(badges) {
  return (badges || []).map((b) => ({
    id: b._id ? b._id.toString() : `${b.venueId}`,
    venueId: b.venueId,
    venueName: b.venueName,
    badgeType: b.badgeType,
    visitCount: b.visitCount || 0,
    lastVisitAt: b.lastVisitAt ? new Date(b.lastVisitAt).toISOString() : null,
    unlockedAt: b.unlockedAt ? new Date(b.unlockedAt).toISOString() : new Date().toISOString(),
  }));
}

// Attendance-based tier thresholds. Tunable — this is the single source of
// truth for how visit count maps to badge tier.
const TIER_THRESHOLDS = [
  { tier: 'WHALE', min: 30 },
  { tier: 'PLATINUM', min: 15 },
  { tier: 'REGULAR', min: 5 },
  { tier: 'GUEST', min: 0 },
];
function tierForVisits(visitCount) {
  return (TIER_THRESHOLDS.find((t) => visitCount >= t.min) || { tier: 'GUEST' }).tier;
}
/** Visits needed for the next tier, or null at max. For "N more to REGULAR" UI. */
function nextTierInfo(visitCount) {
  const higher = [...TIER_THRESHOLDS].reverse().find((t) => t.min > visitCount);
  return higher ? { tier: higher.tier, visitsNeeded: higher.min - visitCount } : null;
}

// Haversine distance in meters between two lat/lng points.
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get Current User - Get authenticated user's profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        badges: serializeBadges(user.badges),
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to get user profile',
    });
  }
};

/**
 * Update Profile - Update authenticated user's profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required',
      });
    }

    const { displayName, phoneNumber, dateOfBirth, profileImageUrl } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    // Update fields
    if (displayName !== undefined) user.displayName = displayName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (profileImageUrl !== undefined) user.profileImageUrl = profileImageUrl;

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: messages.join(', '),
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to update profile',
    });
  }
};

/**
 * Forgot Password - Initiate password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Missing email',
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success even if user doesn't exist (security best practice —
    // prevents account enumeration via response timing/content).
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset email will be sent',
      });
    }

    // Generate 1-hour reset token. Stored as a 256-bit hex string; the raw value
    // goes into the email link, and we look it up directly. (If we wanted to
    // avoid storing the raw token, we'd hash it before save and hash again on
    // verify — simpler approach is fine for v1 given tokens expire quickly.)
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Deep link into the app — Expo Router resolves nox://auth/reset-password
    // to app/auth/reset-password.tsx. Email body shows a button using this URL.
    const resetUrl = `nox://auth/reset-password?token=${token}`;

    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailErr) {
      // Don't leak email-send failures to the client (still avoids enumeration).
      // But log loudly so we notice in Sentry / logs.
      console.error('[forgotPassword] failed to send email:', emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists, a password reset email will be sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to process request',
    });
  }
};

/**
 * Reset Password - Complete password reset
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Token and new password are required',
      });
    }

    // Look up by token + check expiry server-side (can't rely on client to skip
    // expired ones). select('+password ...') because those fields are select:false.
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Assigning to user.password triggers the bcrypt pre-save hook.
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Force-logout everywhere by revoking all outstanding refresh tokens. If the
    // password reset was triggered by an account takeover, this kicks the attacker.
    await RefreshToken.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to reset password',
    });
  }
};

/**
 * Delete My Account - Permanently delete authenticated user's account.
 * DELETE /api/auth/me
 *
 * Apple App Store guideline 5.1.1(v) requires apps that support account
 * creation to also support in-app account deletion. Hard-deletes the User
 * document plus identity-linked records (refresh tokens, friendships, blocks).
 * Other content (memories, messages) retains the orphaned userId for now;
 * a deeper cleanup job can run async later if needed.
 */
const deleteMyAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required',
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    const results = await Promise.allSettled([
      RefreshToken.deleteMany({ userId }),
      Friendship.deleteMany({
        $or: [{ requesterId: userId }, { addresseeId: userId }],
      }),
      BlockedUser.deleteMany({
        $or: [{ blockerId: userId }, { blockedUserId: userId }],
      }),
      User.deleteOne({ _id: userId }),
    ]);

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`[deleteMyAccount] cleanup step ${i} failed:`, r.reason?.message);
      }
    });

    console.log(`✅ Account deleted: ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to delete account',
    });
  }
};

/**
 * Award a venue badge to the current user.
 * POST /api/auth/me/badges  body: { venueId, venueName, badgeType }
 *
 * Upsert by venueId: if the user already has a badge for the venue, its type
 * is upgraded (never downgraded) rather than duplicated. Returns the full
 * badge list so the client can replace local state authoritatively.
 */
const BADGE_RANK = { GUEST: 0, REGULAR: 1, PLATINUM: 2, WHALE: 3 };

const awardBadge = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { venueId, venueName, badgeType } = req.body || {};
    if (!venueId) {
      return res.status(400).json({ success: false, error: 'venueId is required' });
    }
    const type = ['GUEST', 'REGULAR', 'PLATINUM', 'WHALE'].includes(badgeType)
      ? badgeType
      : 'GUEST';

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const existing = user.badges.find((b) => b.venueId === venueId);
    if (existing) {
      // Only upgrade — never overwrite a higher tier with a lower one.
      if (BADGE_RANK[type] > BADGE_RANK[existing.badgeType]) {
        existing.badgeType = type;
        existing.unlockedAt = new Date();
      }
      if (venueName) existing.venueName = venueName;
    } else {
      user.badges.push({
        venueId,
        venueName: venueName || 'Venue',
        badgeType: type,
        unlockedAt: new Date(),
      });
    }
    await user.save();

    return res.status(200).json({
      success: true,
      data: { badges: serializeBadges(user.badges) },
    });
  } catch (error) {
    console.error('Award badge error:', error);
    return res.status(500).json({ success: false, error: 'Failed to award badge' });
  }
};

/**
 * Location-verified check-in — the attendance action that drives tiers.
 * POST /api/auth/me/checkin
 *   body: { venueId, venueName, latitude, longitude, venueLat, venueLng }
 *
 * Rules:
 *  - Must be within CHECKIN_RADIUS_M of the venue (server re-verifies).
 *  - At most one check-in per venue per calendar day.
 *  - First check-in creates the badge (also unlocks the venue's chat) and
 *    counts as visit #1. Each subsequent qualifying check-in increments
 *    visitCount; badgeType is recomputed from visitCount.
 * Returns the badge list plus { newVisit, tierUp, previousTier, nextTier }.
 */
const CHECKIN_RADIUS_M = 150;

const checkIn = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { venueId, venueName, latitude, longitude, venueLat, venueLng } = req.body || {};
    if (!venueId) {
      return res.status(400).json({ success: false, error: 'venueId is required' });
    }

    // Proximity check (server-side re-verification of the client's gate).
    if ([latitude, longitude, venueLat, venueLng].every((n) => typeof n === 'number')) {
      const dist = distanceMeters(latitude, longitude, venueLat, venueLng);
      if (dist > CHECKIN_RADIUS_M) {
        return res.status(403).json({
          success: false,
          error: 'TOO_FAR',
          message: `You need to be at the venue to check in (${Math.round(dist)}m away).`,
        });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let badge = user.badges.find((b) => b.venueId === venueId);
    const isSameDay = (a, b) =>
      a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const now = new Date();
    let newVisit = true;
    let previousTier = null;

    if (badge) {
      previousTier = badge.badgeType;
      if (badge.lastVisitAt && isSameDay(new Date(badge.lastVisitAt), now)) {
        // Already checked in tonight — no double counting.
        newVisit = false;
      } else {
        badge.visitCount = (badge.visitCount || 0) + 1;
        badge.lastVisitAt = now;
        badge.badgeType = tierForVisits(badge.visitCount);
      }
      if (venueName) badge.venueName = venueName;
    } else {
      badge = {
        venueId,
        venueName: venueName || 'Venue',
        visitCount: 1,
        lastVisitAt: now,
        badgeType: tierForVisits(1),
        unlockedAt: now,
      };
      user.badges.push(badge);
      previousTier = null;
    }
    await user.save();

    const saved = user.badges.find((b) => b.venueId === venueId);
    const tierUp = previousTier !== null && saved.badgeType !== previousTier;

    // Append to the analytics log — only for a genuine new visit, so
    // same-night re-taps don't inflate a venue's numbers. Non-fatal: a logging
    // failure must never break the user's check-in.
    if (newVisit) {
      CheckIn.create({
        venueId,
        venueName: saved.venueName,
        userId: user._id,
        tier: saved.badgeType,
        visitNumber: saved.visitCount,
        isFirstVisit: previousTier === null,
        lat: typeof latitude === 'number' ? latitude : undefined,
        lng: typeof longitude === 'number' ? longitude : undefined,
      }).catch((err) => console.error('[checkIn] analytics log failed:', err.message));
    }

    return res.status(200).json({
      success: true,
      data: {
        badges: serializeBadges(user.badges),
        newVisit,
        tierUp,
        previousTier,
        currentTier: saved.badgeType,
        visitCount: saved.visitCount,
        nextTier: nextTierInfo(saved.visitCount),
      },
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ success: false, error: 'Failed to check in' });
  }
};

/**
 * Remove a venue badge from the current user.
 * DELETE /api/auth/me/badges/:venueId
 */
const removeBadge = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const { venueId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    user.badges = user.badges.filter((b) => b.venueId !== venueId);
    await user.save();

    return res.status(200).json({
      success: true,
      data: { badges: serializeBadges(user.badges) },
    });
  } catch (error) {
    console.error('Remove badge error:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove badge' });
  }
};

module.exports = {
  signUp,
  signIn,
  refresh,
  signOut,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  deleteMyAccount,
  awardBadge,
  removeBadge,
  checkIn,
};
