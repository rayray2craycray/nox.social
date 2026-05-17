/**
 * Authentication Routes
 * Endpoints for email/password authentication, OAuth, and token management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const instagramService = require('../services/instagram.service');
const {
  signUp,
  signIn,
  refresh,
  signOut,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  deleteMyAccount,
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation');
const {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
} = require('../validators/auth.validator');

const router = express.Router();

/**
 * Email/Password Authentication Routes
 */

// POST /auth/signup - Register new user
router.post('/signup', validate(signUpSchema), signUp);

// POST /auth/signin - Authenticate user
router.post('/signin', validate(signInSchema), signIn);

// POST /auth/refresh - Refresh access token
router.post('/refresh', validate(refreshTokenSchema), refresh);

// POST /auth/signout - Sign out and revoke token
router.post('/signout', signOut);

// GET /auth/me - Get current user profile (protected)
router.get('/me', authMiddleware, getMe);

// DELETE /auth/me - Permanently delete current user's account (App Store requirement)
router.delete('/me', authMiddleware, deleteMyAccount);

// PUT /auth/profile - Update user profile (protected)
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);

// POST /auth/forgot-password - Initiate password reset
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

// POST /auth/reset-password - Complete password reset
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

/**
 * Instagram OAuth Routes
 */

/**
 * POST /auth/instagram/token
 * Exchange Instagram authorization code for access token
 */
router.post(
  '/instagram/token',
  [
    body('code')
      .isString()
      .notEmpty()
      .withMessage('Authorization code is required'),
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code } = req.body;

      console.log('Instagram token exchange request');

      // Complete OAuth flow - get long-lived token
      const tokenData = await instagramService.completeOAuthFlow(code);

      console.log(`Instagram OAuth successful for user: ${tokenData.username}`);

      // Find or create user with Instagram ID
      let user = await User.findOne({ instagramId: tokenData.userId });

      if (user) {
        // Update existing user
        user.instagramUsername = tokenData.username;
        user.instagramAccessToken = tokenData.accessToken;
        user.instagramTokenExpires = tokenData.expiresAt;
        await user.save();

        console.log(`Updated existing user: ${user._id}`);
      } else {
        // Check if user exists with this username
        user = await User.findOne({ instagramUsername: tokenData.username });

        if (user) {
          // Link Instagram to existing account
          user.instagramId = tokenData.userId;
          user.instagramAccessToken = tokenData.accessToken;
          user.instagramTokenExpires = tokenData.expiresAt;
          await user.save();

          console.log(`Linked Instagram to existing user: ${user._id}`);
        } else {
          // Create new user
          user = await User.create({
            displayName: tokenData.username,
            instagramId: tokenData.userId,
            instagramUsername: tokenData.username,
            instagramAccessToken: tokenData.accessToken,
            instagramTokenExpires: tokenData.expiresAt,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(tokenData.username)}`,
          });

          console.log(`Created new user: ${user._id}`);
        }
      }

      // Return token data (excluding sensitive info)
      res.json({
        accessToken: tokenData.accessToken,
        userId: tokenData.userId,
        username: tokenData.username,
        expiresAt: tokenData.expiresAt,
        appUserId: user._id.toString(),
      });
    } catch (error) {
      console.error('Instagram token exchange error:', error);
      res.status(500).json({
        error: 'Failed to exchange Instagram token',
        message: error.message,
      });
    }
  }
);

/**
 * POST /auth/instagram/refresh
 * Refresh Instagram long-lived token
 */
router.post(
  '/instagram/refresh',
  [
    body('accessToken')
      .isString()
      .notEmpty()
      .withMessage('Access token is required'),
    body('userId')
      .isString()
      .notEmpty()
      .withMessage('User ID is required'),
  ],
  async (req, res) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { accessToken, userId } = req.body;

      console.log(`Instagram token refresh request for user: ${userId}`);

      // Refresh token
      const refreshData = await instagramService.refreshLongLivedToken(accessToken);

      // Calculate new expiration
      const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

      // Update user record
      await User.findByIdAndUpdate(userId, {
        instagramAccessToken: refreshData.access_token,
        instagramTokenExpires: expiresAt,
      });

      console.log(`Token refreshed successfully for user: ${userId}`);

      res.json({
        accessToken: refreshData.access_token,
        expiresIn: refreshData.expires_in,
        expiresAt,
      });
    } catch (error) {
      console.error('Instagram token refresh error:', error);
      res.status(500).json({
        error: 'Failed to refresh Instagram token',
        message: error.message,
      });
    }
  }
);

module.exports = router;
