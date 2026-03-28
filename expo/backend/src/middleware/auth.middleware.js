/**
 * Authentication Middleware
 * Middleware to verify JWT tokens and attach user to request
 */

const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 * Fails request if no valid token is provided
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Authentication failed',
      });
    }

    // Check if user still exists
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Authentication failed',
      });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid token',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * Useful for endpoints that work both authenticated and unauthenticated
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      if (payload) {
        const user = await User.findById(payload.userId);
        if (user) {
          req.user = {
            id: user._id.toString(),
            email: user.email,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth if there's an error
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
