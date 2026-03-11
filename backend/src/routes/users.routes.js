/**
 * User Routes
 * Endpoints for user authentication and profile management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage (replace with real database)
const users = new Map();
const tokens = new Map();

// Helper: Hash password (simple for now - use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper: Generate JWT
function generateToken(userId) {
  return jwt.sign(
    { sub: userId, iat: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Helper: Generate refresh token
function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/auth/register',
  [
    body('username').isString().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, displayName } = req.body;

    // Check if username exists
    for (const [id, user] of users.entries()) {
      if (user.username === username) {
        return res.status(409).json({
          message: 'Username already exists',
          code: 'USERNAME_TAKEN',
        });
      }
    }

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      username,
      password: hashPassword(password),
      email: email || null,
      displayName: displayName || username,
      avatarUrl: null,
      role: 'USER',
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    users.set(userId, user);

    // Generate tokens
    const accessToken = generateToken(userId);
    const refreshToken = generateRefreshToken();
    tokens.set(refreshToken, { userId, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    console.log(`✅ User registered: ${username} (${userId})`);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  }
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/auth/login',
  [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const passwordHash = hashPassword(password);

    // Find user
    let foundUser = null;
    for (const [id, user] of users.entries()) {
      if (user.username === username && user.password === passwordHash) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({
        message: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate tokens
    const accessToken = generateToken(foundUser.id);
    const refreshToken = generateRefreshToken();
    tokens.set(refreshToken, { userId: foundUser.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    console.log(`✅ User logged in: ${username}`);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = foundUser;
    res.json({
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  const tokenData = tokens.get(refreshToken);
  if (!tokenData) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  if (tokenData.expiresAt < Date.now()) {
    tokens.delete(refreshToken);
    return res.status(401).json({ message: 'Refresh token expired' });
  }

  // Generate new tokens
  const newAccessToken = generateToken(tokenData.userId);
  const newRefreshToken = generateRefreshToken();
  tokens.delete(refreshToken);
  tokens.set(newRefreshToken, { userId: tokenData.userId, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
router.get('/users/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.get(decoded.sub);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

/**
 * PATCH /api/v1/users/me
 * Update current user profile
 */
router.patch('/users/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.get(decoded.sub);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const { displayName, bio, isIncognito } = req.body;
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (isIncognito !== undefined) user.isIncognito = isIncognito;

    users.set(decoded.sub, user);

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

/**
 * GET /api/v1/users/me/suggestions
 * Get friend suggestions
 */
router.get('/users/me/suggestions', (req, res) => {
  // Return mock suggestions
  res.json({
    suggestions: [
      {
        id: 'user-suggested-1',
        displayName: 'Sarah Chen',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        bio: 'Love nightlife!',
        mutualFriends: 5,
      },
      {
        id: 'user-suggested-2',
        displayName: 'Marcus Wright',
        avatarUrl: 'https://i.pravatar.cc/150?img=12',
        bio: 'DJ and music producer',
        mutualFriends: 3,
      },
    ],
    total: 2,
  });
});

module.exports = router;
