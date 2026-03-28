/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user has admin privileges
 */

const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has ADMIN or SUPER_ADMIN role
 * Must be used after authMiddleware
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      logger.warn('Admin access attempt without authentication');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
    }

    // Get full user details (authMiddleware only provides id and email)
    const user = await User.findById(req.user.id).select('+role');

    if (!user) {
      logger.warn('Admin access attempt with invalid user ID', {
        userId: req.user.id,
      });
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Invalid user credentials',
      });
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      logger.warn('Unauthorized admin access attempt', {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }

    // Attach full user info to request
    req.admin = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };

    logger.info('Admin access granted', {
      adminId: user._id.toString(),
      role: user.role,
    });

    next();
  } catch (error) {
    logger.error('Admin middleware error', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
      message: 'An error occurred while verifying your permissions',
    });
  }
};

/**
 * Middleware to check if user has SUPER_ADMIN role
 * Use for highly sensitive operations
 */
const superAdminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const user = await User.findById(req.user.id).select('+role');

    if (!user || user.role !== 'SUPER_ADMIN') {
      logger.warn('Unauthorized super admin access attempt', {
        userId: req.user.id,
        role: user?.role,
      });

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Super admin privileges required',
      });
    }

    req.admin = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Super admin middleware error', {
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      error: 'Authorization check failed',
    });
  }
};

module.exports = {
  adminMiddleware,
  superAdminMiddleware,
};
