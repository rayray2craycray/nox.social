/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 */

const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Friendship = require('../models/Friendship.model');
const BlockedUser = require('../models/BlockedUser');
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
};
