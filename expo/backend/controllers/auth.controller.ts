import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { RefreshToken } from '../models/RefreshToken.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  getExpiresIn,
  getExpiryDate,
} from '../utils/jwt.utils';

/**
 * Sign Up - Register a new user
 */
export const signUp = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Sign up error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
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
 */
export const signIn = async (req: Request, res: Response) => {
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
 */
export const refresh = async (req: Request, res: Response) => {
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
 */
export const signOut = async (req: Request, res: Response) => {
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
 */
export const getMe = async (req: Request, res: Response) => {
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
 */
export const updateProfile = async (req: Request, res: Response) => {
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
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
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
  } catch (error: any) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
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
 */
export const forgotPassword = async (req: Request, res: Response) => {
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

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset email will be sent',
      });
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    // In production, you would:
    // 1. Generate a reset token
    // 2. Save token to database with expiry
    // 3. Send email with reset link

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
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Token and new password are required',
      });
    }

    // TODO: Verify reset token and update password
    // For now, return error
    // In production, you would:
    // 1. Find token in database
    // 2. Check if expired
    // 3. Update user password
    // 4. Revoke token

    return res.status(501).json({
      success: false,
      error: 'Not implemented',
      message: 'Password reset not yet implemented',
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
