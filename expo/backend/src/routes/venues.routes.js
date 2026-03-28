/**
 * Venue Routes
 * Endpoints for venue discovery, vibe checks, and venue management
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const router = express.Router();

// In-memory storage (replace with real database)
const venues = new Map();
const vibeChecks = new Map();
const vibeData = new Map();

// Initialize mock venues
const mockVenues = [
  {
    id: 'venue-1',
    name: 'The Midnight Lounge',
    category: 'LOUNGE',
    description: 'Upscale cocktail lounge with live jazz',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
    },
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    ],
    hours: {
      monday: { open: '17:00', close: '02:00' },
      tuesday: { open: '17:00', close: '02:00' },
      wednesday: { open: '17:00', close: '02:00' },
      thursday: { open: '17:00', close: '02:00' },
      friday: { open: '17:00', close: '02:00' },
      saturday: { open: '17:00', close: '02:00' },
      sunday: { open: '17:00', close: '00:00' },
    },
    currentStatus: 'OPEN',
    capacity: 200,
    currentOccupancy: 150,
    isToastEnabled: true,
    spendToUnlock: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'venue-2',
    name: 'Neon Nightclub',
    category: 'NIGHTCLUB',
    description: 'High-energy nightclub with top DJs',
    address: {
      street: '456 Club Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94103',
    },
    location: {
      latitude: 37.7739,
      longitude: -122.4184,
    },
    photos: [
      'https://images.unsplash.com/photo-1571266028243-d220c6e2d6cf',
    ],
    hours: {
      thursday: { open: '21:00', close: '04:00' },
      friday: { open: '21:00', close: '04:00' },
      saturday: { open: '21:00', close: '04:00' },
    },
    currentStatus: 'OPEN',
    capacity: 500,
    currentOccupancy: 350,
    isToastEnabled: true,
    spendToUnlock: 100,
    createdAt: new Date().toISOString(),
  },
];

// Initialize venues
mockVenues.forEach(venue => venues.set(venue.id, venue));

// Initialize mock vibe data
mockVenues.forEach(venue => {
  vibeData.set(venue.id, {
    venueId: venue.id,
    music: 82,
    density: 75,
    energy: 88,
    waitTime: 15,
    totalVotes: 47,
    lastUpdated: new Date().toISOString(),
  });
});

// Helper: Verify JWT token
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.sub; // userId
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/v1/venues
 * Get all venues (with optional filtering)
 */
router.get('/venues', [
  query('category').optional().isString(),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isInt({ min: 1, max: 50 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, latitude, longitude, radius } = req.query;

  let venueList = Array.from(venues.values());

  // Filter by category
  if (category) {
    venueList = venueList.filter(v => v.category === category);
  }

  // Filter by distance (if lat/lng provided)
  if (latitude && longitude) {
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const searchRadius = radius ? parseInt(radius) : 10; // km

    venueList = venueList.filter(v => {
      const distance = calculateDistance(
        userLat,
        userLng,
        v.location.latitude,
        v.location.longitude
      );
      return distance <= searchRadius;
    });
  }

  // Add vibe data to each venue
  const venuesWithVibes = venueList.map(venue => {
    const vibe = vibeData.get(venue.id) || {
      music: 0,
      density: 0,
      energy: 0,
      waitTime: 0,
      totalVotes: 0,
    };

    return {
      ...venue,
      vibeData: vibe,
    };
  });

  res.json({
    venues: venuesWithVibes,
    total: venuesWithVibes.length,
  });
});

/**
 * GET /api/v1/venues/:venueId
 * Get venue details
 */
router.get('/venues/:venueId', [
  param('venueId').isString().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { venueId } = req.params;
  const venue = venues.get(venueId);

  if (!venue) {
    return res.status(404).json({
      message: 'Venue not found',
      code: 'VENUE_NOT_FOUND',
    });
  }

  // Add vibe data
  const vibe = vibeData.get(venueId) || {
    music: 0,
    density: 0,
    energy: 0,
    waitTime: 0,
    totalVotes: 0,
  };

  res.json({
    ...venue,
    vibeData: vibe,
  });
});

/**
 * GET /api/v1/venues/:venueId/vibe-data
 * Get current vibe data for a venue
 */
router.get('/venues/:venueId/vibe-data', [
  param('venueId').isString().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { venueId } = req.params;
  const venue = venues.get(venueId);

  if (!venue) {
    return res.status(404).json({
      message: 'Venue not found',
      code: 'VENUE_NOT_FOUND',
    });
  }

  const vibe = vibeData.get(venueId) || {
    venueId,
    music: 0,
    density: 0,
    energy: 0,
    waitTime: 0,
    totalVotes: 0,
    lastUpdated: new Date().toISOString(),
  };

  res.json(vibe);
});

/**
 * POST /api/v1/venues/:venueId/vibe-check
 * Submit a vibe check (requires authentication)
 */
router.post('/venues/:venueId/vibe-check', [
  param('venueId').isString().notEmpty(),
  body('music').isInt({ min: 0, max: 100 }),
  body('density').isInt({ min: 0, max: 100 }),
  body('energy').isInt({ min: 0, max: 100 }),
  body('waitTime').isInt({ min: 0, max: 180 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Verify authentication
  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({
      message: 'Authorization token required',
      code: 'UNAUTHORIZED',
    });
  }

  const { venueId } = req.params;
  const { music, density, energy, waitTime } = req.body;

  const venue = venues.get(venueId);
  if (!venue) {
    return res.status(404).json({
      message: 'Venue not found',
      code: 'VENUE_NOT_FOUND',
    });
  }

  // Create vibe check
  const vibeCheckId = `vibe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const vibeCheck = {
    id: vibeCheckId,
    venueId,
    userId,
    music,
    density,
    energy,
    waitTime,
    createdAt: new Date().toISOString(),
  };

  vibeChecks.set(vibeCheckId, vibeCheck);

  // Update aggregated vibe data
  const currentVibe = vibeData.get(venueId) || {
    venueId,
    music: 0,
    density: 0,
    energy: 0,
    waitTime: 0,
    totalVotes: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Simple weighted average (more recent votes have more weight)
  const weight = 0.3; // New vote weight
  const updatedVibe = {
    venueId,
    music: Math.round(currentVibe.music * (1 - weight) + music * weight),
    density: Math.round(currentVibe.density * (1 - weight) + density * weight),
    energy: Math.round(currentVibe.energy * (1 - weight) + energy * weight),
    waitTime: Math.round(currentVibe.waitTime * (1 - weight) + waitTime * weight),
    totalVotes: currentVibe.totalVotes + 1,
    lastUpdated: new Date().toISOString(),
  };

  vibeData.set(venueId, updatedVibe);

  console.log(`✅ Vibe check submitted for ${venue.name} by user ${userId}`);

  res.status(201).json({
    vibeCheck,
    updatedVibeData: updatedVibe,
  });
});

/**
 * GET /api/v1/venues/:venueId/vibe-checks
 * Get recent vibe checks for a venue
 */
router.get('/venues/:venueId/vibe-checks', [
  param('venueId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { venueId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 20;

  const venue = venues.get(venueId);
  if (!venue) {
    return res.status(404).json({
      message: 'Venue not found',
      code: 'VENUE_NOT_FOUND',
    });
  }

  // Get all vibe checks for this venue
  const checks = Array.from(vibeChecks.values())
    .filter(check => check.venueId === venueId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  res.json({
    vibeChecks: checks,
    total: checks.length,
  });
});

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;
