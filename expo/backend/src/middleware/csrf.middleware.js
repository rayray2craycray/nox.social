/**
 * CSRF Protection Middleware (Double-Submit Cookie Pattern)
 * Modern approach for API protection without deprecated csurf package
 *
 * How it works:
 * 1. Server generates a random CSRF token on GET requests
 * 2. Token is sent as both:
 *    - HTTP-only cookie (secure, not accessible to JS)
 *    - Response header (accessible to client JS)
 * 3. Client includes token in custom header (X-CSRF-Token) for state-changing requests
 * 4. Server validates that cookie token matches header token
 *
 * This protects against CSRF attacks because:
 * - Attacker sites can't read cookies due to Same-Origin Policy
 * - Attacker sites can't set custom headers on cross-origin requests
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Generate a cryptographically secure random token
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF token generator middleware
 * Sets CSRF token as cookie and header for safe requests (GET, HEAD, OPTIONS)
 */
function csrfTokenGenerator(req, res, next) {
  // Only generate token for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Check if token already exists
    let token = req.cookies.csrfToken;

    // Generate new token if not present
    if (!token) {
      token = generateCsrfToken();

      // Set secure HTTP-only cookie
      res.cookie('csrfToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // Strict same-site policy
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Send token in response header for client to include in requests
    res.setHeader('X-CSRF-Token', token);
  }

  next();
}

/**
 * CSRF token validator middleware
 * Validates CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 */
function csrfProtection(req, res, next) {
  // Skip validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies.csrfToken;

  // Get token from header
  const headerToken = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'];

  // Validate both tokens exist
  if (!cookieToken || !headerToken) {
    logger.warn('CSRF validation failed - missing token', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    });

    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'Please include X-CSRF-Token header in your request',
    });
  }

  // Validate tokens match
  if (cookieToken !== headerToken) {
    logger.warn('CSRF validation failed - token mismatch', {
      ip: req.ip,
      method: req.method,
      path: req.path,
    });

    return res.status(403).json({
      success: false,
      error: 'CSRF token invalid',
      message: 'CSRF token mismatch',
    });
  }

  // Tokens match - request is valid
  next();
}

/**
 * Optional: Exempt certain routes from CSRF protection
 * Useful for webhooks, public APIs, etc.
 */
function csrfExempt(exemptPaths = []) {
  return (req, res, next) => {
    // Check if current path is exempt
    const isExempt = exemptPaths.some((path) => {
      if (typeof path === 'string') {
        return req.path.startsWith(path);
      }
      if (path instanceof RegExp) {
        return path.test(req.path);
      }
      return false;
    });

    if (isExempt) {
      return next();
    }

    // Not exempt, apply CSRF protection
    return csrfProtection(req, res, next);
  };
}

/**
 * Get CSRF token endpoint
 * GET /api/csrf-token
 * Returns the current CSRF token for the session
 */
function getCsrfToken(req, res) {
  const token = req.cookies.csrfToken || generateCsrfToken();

  // Set cookie if not present
  if (!req.cookies.csrfToken) {
    res.cookie('csrfToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  res.json({
    success: true,
    csrfToken: token,
  });
}

module.exports = {
  csrfTokenGenerator,
  csrfProtection,
  csrfExempt,
  getCsrfToken,
};
