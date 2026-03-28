import { Router } from 'express';
import {
  signUp,
  signIn,
  refresh,
  signOut,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * Public Routes (No authentication required)
 */

// POST /api/auth/signup - Register new user
router.post('/signup', signUp);

// POST /api/auth/signin - Authenticate user
router.post('/signin', signIn);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refresh);

// POST /api/auth/signout - Sign out and revoke token
router.post('/signout', signOut);

// POST /api/auth/forgot-password - Initiate password reset
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password - Complete password reset
router.post('/reset-password', resetPassword);

/**
 * Protected Routes (Require authentication)
 */

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, getMe);

// PUT /api/auth/profile - Update user profile
router.put('/profile', authMiddleware, updateProfile);

export default router;
