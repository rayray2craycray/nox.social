/**
 * Analytics Controller
 *
 * Venue-facing analytics — the "here's what Nox does for you" numbers. The
 * heavy lifting lives in analytics.service (shared with the magic-link web
 * dashboard); this file handles auth and HTTP shape.
 *
 * Two surfaces:
 *   - getVenueAnalytics    → in-app / API, gated to admins + VIEW_ANALYTICS roles
 *   - createAnalyticsLink  → admin mints a shareable magic link for a venue
 */

const User = require('../models/User');
const Venue = require('../models/Venue');
const VenueRole = require('../models/VenueRole');
const { computeVenueAnalytics } = require('../services/analytics.service');
const { signVenueToken, dashboardUrl } = require('../utils/venueLink.utils');

/**
 * Authorize the requester for a venue's analytics.
 * Allowed if: platform admin, OR active VenueRole carrying VIEW_ANALYTICS /
 * FULL_ACCESS (venue matched by Mongo _id or Place ID). Returns { ok }.
 */
async function authorizeVenueViewer(userId, venueId) {
  const user = await User.findById(userId).select('role');
  if (!user) return { ok: false };
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return { ok: true, admin: true };

  let venueMongoId = null;
  if (/^[0-9a-fA-F]{24}$/.test(venueId)) {
    const v = await Venue.findById(venueId).select('_id');
    if (v) venueMongoId = v._id;
  }
  if (!venueMongoId) {
    const v = await Venue.findOne({ googlePlaceId: venueId }).select('_id');
    if (v) venueMongoId = v._id;
  }
  if (!venueMongoId) return { ok: false };

  const role = await VenueRole.findOne({
    venueId: venueMongoId,
    userId,
    isActive: true,
    permissions: { $in: ['VIEW_ANALYTICS', 'FULL_ACCESS'] },
  });
  return { ok: !!role };
}

/**
 * GET /api/v1/venues/:venueId/analytics?tz=America/New_York
 */
exports.getVenueAnalytics = async (req, res) => {
  const { venueId } = req.params;
  const tz = typeof req.query.tz === 'string' && req.query.tz ? req.query.tz : 'America/New_York';
  try {
    const auth = await authorizeVenueViewer(req.user.id, venueId);
    if (!auth.ok) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this venue' });
    }
    const data = await computeVenueAnalytics(venueId, tz);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[getVenueAnalytics] error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load analytics' });
  }
};

/**
 * POST /api/v1/venues/:venueId/analytics-link
 * Allowed for platform admins (to pitch prospects) and for a venue's own
 * VIEW_ANALYTICS role holders (to share a read-only snapshot of their numbers).
 * body: { days?: number (default 30), tz?: string }
 */
exports.createAnalyticsLink = async (req, res) => {
  const { venueId } = req.params;
  try {
    const auth = await authorizeVenueViewer(req.user.id, venueId);
    if (!auth.ok) {
      return res.status(403).json({ success: false, error: 'Not authorized for this venue' });
    }
    const days = Math.min(Math.max(parseInt(req.body?.days, 10) || 30, 1), 365);
    const tz = typeof req.body?.tz === 'string' && req.body.tz ? req.body.tz : 'America/New_York';
    const token = signVenueToken(venueId, { days, tz });
    return res.json({
      success: true,
      data: { url: dashboardUrl(req, token), expiresInDays: days },
    });
  } catch (err) {
    console.error('[createAnalyticsLink] error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create link' });
  }
};
