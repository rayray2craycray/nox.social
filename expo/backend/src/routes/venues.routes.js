/**
 * Venue Routes
 * Endpoints for venue discovery, vibe checks, and venue management.
 *
 * Migrated from in-memory Map storage to MongoDB-backed persistence on
 * 2026-06-29 (Phase 1, v1.0 launch prep). The /venues/nearby Google Places
 * proxy remains pass-through to Google and does not touch the DB.
 */

const express = require('express');
const { query, body, param, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Venue = require('../models/Venue');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getVenueAnalytics, createAnalyticsLink } = require('../controllers/analytics.controller');

const router = express.Router();

/**
 * POST /api/v1/venues/member-counts
 * Body: { venueIds: string[] }  →  { counts: { [venueId]: number } }
 *
 * Real member count = number of users who hold a badge for the venue. Replaces
 * the frontend's hardcoded "1 member" placeholder on the servers screen.
 */
router.post('/venues/member-counts', async (req, res) => {
  const { venueIds } = req.body || {};
  if (!Array.isArray(venueIds) || venueIds.length === 0) {
    return res.json({ success: true, counts: {} });
  }
  try {
    const agg = await User.aggregate([
      { $unwind: '$badges' },
      { $match: { 'badges.venueId': { $in: venueIds } } },
      { $group: { _id: '$badges.venueId', count: { $sum: 1 } } },
    ]);
    const counts = {};
    for (const row of agg) counts[row._id] = row.count;
    // venues with zero badge holders won't appear in agg; default them to 0
    for (const id of venueIds) if (!(id in counts)) counts[id] = 0;
    return res.json({ success: true, counts });
  } catch (err) {
    console.error('[venues/member-counts] error:', err);
    return res.status(500).json({ success: false, error: 'Failed to count members' });
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated userId (string) from a Bearer token, or null.
 * Mirrors the inline pattern used elsewhere in routes/*.routes.js.
 */
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId || decoded.sub || null;
  } catch {
    return null;
  }
}

/**
 * Look up a Venue by either its Mongo _id or its googlePlaceId. The map tab
 * sources venues from Google Places, so most venueIds passed to /vibe-check
 * etc. are Place IDs that may or may not exist in our DB yet.
 */
async function findVenueByEitherId(venueId) {
  // Try Mongo _id first (must be 24-char hex)
  if (/^[0-9a-fA-F]{24}$/.test(venueId)) {
    const byMongoId = await Venue.findById(venueId);
    if (byMongoId) return byMongoId;
  }
  return Venue.findOne({ googlePlaceId: venueId });
}

/**
 * Serialize a Venue document for API response, normalizing _id → id and
 * always including a (possibly default) vibeData block.
 */
function serializeVenue(venue) {
  const obj = venue.toObject ? venue.toObject() : venue;
  return {
    id: obj._id?.toString() || obj.id,
    googlePlaceId: obj.googlePlaceId,
    name: obj.name,
    type: obj.type,
    location: obj.location,
    rating: obj.rating,
    priceLevel: obj.priceLevel,
    hours: obj.hours,
    imageUrl: obj.imageUrl,
    tags: obj.tags,
    genres: obj.genres,
    capacity: obj.capacity,
    features: obj.features,
    isOpen: obj.isOpen,
    currentVibeLevel: obj.currentVibeLevel,
    coverCharge: obj.coverCharge,
    status: obj.status,
    vibeData: serializeVibeData(obj.vibeData, obj._id?.toString() || obj.id),
    createdAt: obj.createdAt,
  };
}

function serializeVibeData(vd, venueId) {
  return {
    venueId,
    music: vd?.music || 0,
    density: vd?.density || 0,
    energy: vd?.energy || 0,
    waitTime: vd?.waitTime || 0,
    totalVotes: vd?.totalVotes || 0,
    lastUpdated: vd?.lastUpdated || new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// GET /api/v1/venues
// List venues with optional filters. Was the in-memory mock list; now reads
// from MongoDB. Almost no consumers in the current frontend (map tab uses
// /venues/nearby instead), but kept for completeness.
// ---------------------------------------------------------------------------
router.get(
  '/venues',
  [
    query('category').optional().isString(),
    query('latitude').optional().isFloat({ min: -90, max: 90 }),
    query('longitude').optional().isFloat({ min: -180, max: 180 }),
    query('radius').optional().isFloat({ min: 0.1, max: 100 }), // km
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { category, latitude, longitude, radius } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

      const filter = { status: 'ACTIVE' };
      if (category) filter.type = category;

      let cursor;
      if (latitude && longitude) {
        // Geospatial nearby query (2dsphere index on location.coordinates)
        const radiusKm = radius ? parseFloat(radius) : 10;
        cursor = Venue.find({
          ...filter,
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)],
              },
              $maxDistance: radiusKm * 1000, // meters
            },
          },
        }).limit(limit);
      } else {
        cursor = Venue.find(filter).limit(limit);
      }

      const venues = await cursor;
      res.json({
        venues: venues.map(serializeVenue),
        total: venues.length,
      });
    } catch (err) {
      console.error('[GET /venues] error:', err);
      res.status(500).json({ message: 'Failed to fetch venues' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/venues/nearby
// Google Places nearbysearch proxy. Unchanged from the 4/29 implementation —
// does not touch the DB. Must be registered before /:venueId so Express
// doesn't match venueId='nearby'.
// ---------------------------------------------------------------------------
router.get(
  '/venues/nearby',
  [
    query('latitude').isFloat({ min: -90, max: 90 }),
    query('longitude').isFloat({ min: -180, max: 180 }),
    query('radius').optional().isInt({ min: 1, max: 50000 }),
    query('keywords').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'Server misconfigured: GOOGLE_MAPS_API_KEY not set',
        code: 'PLACES_KEY_MISSING',
      });
    }

    const { latitude, longitude } = req.query;
    const location = `${latitude},${longitude}`;
    const radius = req.query.radius ? parseInt(req.query.radius, 10) : 30000;

    // Nightlife on Google Places = the place TYPES 'bar' and 'night_club'.
    // We search by type (authoritative + precise) and add a few keyword passes
    // that surface college/neighborhood spots the prominence-ranked type search
    // crowds out. Every result is then filtered by its types array below, so
    // keyword false-positives (barber "lounges", pilates "clubs") don't leak in.
    const searches = req.query.keywords
      ? String(req.query.keywords).split(',').map((k) => k.trim()).filter(Boolean).map((keyword) => ({ keyword }))
      : [
          { type: 'night_club' },
          { type: 'bar' },
          { keyword: 'college bar' },
          { keyword: 'pub' },
          { keyword: 'sports bar' },
        ];

    try {
      const responses = await Promise.all(
        searches.map((extra) =>
          axios
            .get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
              params: { location, radius, key: apiKey, ...extra },
              timeout: 10000,
            })
            .then((r) => r.data)
            .catch((err) => ({ status: 'ERROR', error_message: err.message }))
        )
      );

      if (responses.every((r) => r.status === 'REQUEST_DENIED')) {
        const first = responses.find((r) => r.status === 'REQUEST_DENIED');
        return res.status(502).json({
          status: 'REQUEST_DENIED',
          error_message: first.error_message,
          message: 'Google Places rejected the request — check key restrictions, billing, or enabled APIs.',
        });
      }

      // Authoritative nightlife filter. Keep only real bars/clubs and drop the
      // junk (restaurants, barbershops, gyms/pilates, country/golf clubs, hotels).
      const ALLOW_TYPES = new Set(['bar', 'night_club']);
      const DENY_TYPES = new Set([
        'gym', 'spa', 'hair_care', 'beauty_salon', 'lodging', 'gas_station',
        'hospital', 'school', 'bank', 'supermarket', 'pharmacy', 'doctor',
        'church', 'place_of_worship', 'park', 'shopping_mall', 'store',
      ]);
      const NAME_DENY = /\b(country club|golf|pilates|yoga|barber|nail salon|nail bar|spa|salon|fitness|crossfit|cigar)\b/i;
      const isNightlife = (place) => {
        const types = place.types || [];
        if (!types.some((t) => ALLOW_TYPES.has(t))) return false; // must be a bar/club
        if (types.some((t) => DENY_TYPES.has(t))) return false;
        if (NAME_DENY.test(place.name || '')) return false;
        if (place.business_status && place.business_status !== 'OPERATIONAL') return false;
        // Drop "restaurant with a bar" (Olive Garden, Applebee's): Google lists
        // the primary category first, so a restaurant-primary place isn't
        // nightlife — unless it's also an actual night_club.
        if (types[0] === 'restaurant' && !types.includes('night_club')) return false;
        return true;
      };

      const merged = [];
      const seen = new Set();
      for (const r of responses) {
        if (r.status !== 'OK' || !Array.isArray(r.results)) continue;
        for (const place of r.results) {
          if (seen.has(place.place_id)) continue;
          if (!isNightlife(place)) continue;
          seen.add(place.place_id);
          merged.push(place);
        }
      }

      return res.json({ status: 'OK', results: merged });
    } catch (err) {
      console.error('[venues/nearby] proxy error:', err.message);
      return res.status(502).json({
        message: 'Failed to reach Google Places',
        code: 'PLACES_UPSTREAM_ERROR',
      });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/venues/:venueId/analytics
// Venue-facing dashboard data (attendance, community, ticket taps). Protected:
// caller must be a platform admin or hold a VIEW_ANALYTICS role for the venue.
// Registered before /:venueId is fine — the extra path segment disambiguates.
// ---------------------------------------------------------------------------
router.get(
  '/venues/:venueId/analytics',
  authMiddleware,
  [param('venueId').isString().notEmpty()],
  getVenueAnalytics
);

// POST /api/v1/venues/:venueId/analytics-link
// Admin-only: mint a shareable magic link to the venue's live web dashboard.
router.post(
  '/venues/:venueId/analytics-link',
  authMiddleware,
  [param('venueId').isString().notEmpty()],
  createAnalyticsLink
);

// ---------------------------------------------------------------------------
// GET /api/v1/venues/:venueId
// Look up by Mongo _id or by googlePlaceId.
// ---------------------------------------------------------------------------
router.get(
  '/venues/:venueId',
  [param('venueId').isString().notEmpty()],
  async (req, res) => {
    try {
      const venue = await findVenueByEitherId(req.params.venueId);
      if (!venue) {
        return res
          .status(404)
          .json({ message: 'Venue not found', code: 'VENUE_NOT_FOUND' });
      }
      res.json(serializeVenue(venue));
    } catch (err) {
      console.error('[GET /venues/:venueId] error:', err);
      res.status(500).json({ message: 'Failed to fetch venue' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/venues/:venueId/vibe-data
// Current aggregated vibe scores. Returns zero-filled object if the venue
// has no submissions yet — the frontend (AppStateContext) handles ?? 0.
// ---------------------------------------------------------------------------
router.get(
  '/venues/:venueId/vibe-data',
  [param('venueId').isString().notEmpty()],
  async (req, res) => {
    try {
      const venue = await findVenueByEitherId(req.params.venueId);
      if (!venue) {
        // For unknown Place IDs (venue not yet in DB), return zeros rather
        // than 404 so the UI shows "no votes yet" rather than an error state.
        return res.json(serializeVibeData(null, req.params.venueId));
      }
      res.json(serializeVibeData(venue.vibeData, venue._id.toString()));
    } catch (err) {
      console.error('[GET /vibe-data] error:', err);
      res.status(500).json({ message: 'Failed to fetch vibe data' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/v1/venues/:venueId/vibe-check
// Submit a vibe check. Auto-creates a stub Venue document on first vote for
// a Google Place ID we haven't seen — keeps the user flow unblocked without
// requiring a separate "import venue" step.
// ---------------------------------------------------------------------------
router.post(
  '/venues/:venueId/vibe-check',
  [
    param('venueId').isString().notEmpty(),
    body('music').isInt({ min: 0, max: 100 }),
    body('density').isInt({ min: 0, max: 100 }),
    body('energy').isInt({ min: 0, max: 100 }),
    body('waitTime').isInt({ min: 0, max: 180 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const userId = verifyToken(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Authorization token required', code: 'UNAUTHORIZED' });
    }

    const { venueId } = req.params;
    const { music, density, energy, waitTime } = req.body;

    try {
      let venue = await findVenueByEitherId(venueId);

      if (!venue) {
        // First-time check-in for a Google Place we haven't ingested yet.
        // Insert a minimal stub; the data-richening pass (image, hours, etc.)
        // can happen async via the Google details API later.
        if (!/^[0-9a-fA-F]{24}$/.test(venueId)) {
          venue = await Venue.create({
            googlePlaceId: venueId,
            name: 'Unnamed Venue',
            type: 'BAR',
            location: {
              latitude: 0,
              longitude: 0,
              address: 'Unknown',
              city: 'Unknown',
              state: 'Unknown',
            },
            status: 'PENDING_APPROVAL',
            vibeData: {
              music: 0,
              density: 0,
              energy: 0,
              waitTime: 0,
              totalVotes: 0,
            },
          });
        } else {
          return res
            .status(404)
            .json({ message: 'Venue not found', code: 'VENUE_NOT_FOUND' });
        }
      }

      // Weighted rolling average: new vote gets 30% weight.
      const current = venue.vibeData || {
        music: 0,
        density: 0,
        energy: 0,
        waitTime: 0,
        totalVotes: 0,
      };
      const w = 0.3;
      venue.vibeData = {
        music: Math.round(current.music * (1 - w) + music * w),
        density: Math.round(current.density * (1 - w) + density * w),
        energy: Math.round(current.energy * (1 - w) + energy * w),
        waitTime: Math.round(current.waitTime * (1 - w) + waitTime * w),
        totalVotes: (current.totalVotes || 0) + 1,
        lastUpdated: new Date(),
      };
      await venue.save();

      console.log(`✅ Vibe check on ${venue.name} (${venue._id}) by user ${userId}`);

      res.status(201).json({
        vibeCheck: {
          id: `vibe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          venueId: venue._id.toString(),
          userId,
          music,
          density,
          energy,
          waitTime,
          createdAt: new Date().toISOString(),
        },
        updatedVibeData: serializeVibeData(venue.vibeData, venue._id.toString()),
      });
    } catch (err) {
      console.error('[POST /vibe-check] error:', err);
      res.status(500).json({ message: 'Failed to submit vibe check' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/venues/:venueId/vibe-checks
// History of vibe checks. The in-memory mock returned the last N raw checks;
// for v1.0 we don't store individual checks (only the rolling aggregate),
// so this returns an empty array. Add a VibeCheck collection in v1.1 if we
// want to bring this back.
// ---------------------------------------------------------------------------
router.get(
  '/venues/:venueId/vibe-checks',
  [param('venueId').isString().notEmpty()],
  async (_req, res) => {
    res.json({ vibeChecks: [], total: 0 });
  }
);

module.exports = router;
