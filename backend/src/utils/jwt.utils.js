/**
 * JWT Utilities
 * Functions for generating and verifying JWT tokens
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate access token (short-lived JWT)
 * @param {Object} payload - { userId, email }
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Generate refresh token (long-lived random string)
 * @returns {string} Random token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification (for expired token inspection)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Get token expiry time in seconds
 * @param {string} type - 'access' or 'refresh'
 * @returns {number} Expiry time in seconds
 */
const getExpiresIn = (type = 'access') => {
  const expiresIn = type === 'access' ? JWT_EXPIRES_IN : JWT_REFRESH_EXPIRES_IN;

  // Convert to seconds
  if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * (multipliers[unit] || 1);
  }

  return typeof expiresIn === 'number' ? expiresIn : 7 * 24 * 60 * 60;
};

/**
 * Calculate expiry date from now
 * @param {string} type - 'access' or 'refresh'
 * @returns {Date} Expiry date
 */
const getExpiryDate = (type = 'access') => {
  const expiresInSeconds = getExpiresIn(type);
  return new Date(Date.now() + expiresInSeconds * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  decodeToken,
  getExpiresIn,
  getExpiryDate,
};
