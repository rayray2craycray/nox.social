/**
 * Analytics Controller
 *
 * Venue-facing analytics — the "here's what Nox does for you" numbers we show
 * a venue owner. Everything here is REAL, derived from three sources:
 *   - CheckIn log      → attendance (counts, unique visitors, peak hours, trend)
 *   - User.badges      → community size + tier distribution (loyalty)
 *   - Event.ticketTaps → ticket click-throughs Nox drove to the venue's seller
 *
 * Aggregate-only: no per-user identities leave this endpoint. A venue sees how
 * many people and what tiers, never who.
 */

const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Event = require('../models/Event.model');
const Venue = require('../models/Venue');
const VenueRole = require('../models/VenueRole');

const DAY_MS = 24 * 60 * 60 * 1000;

// YYYY-MM-DD for a Date in a given IANA timezone (en-CA formats as ISO date).
function tzDateString(date, tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(date);
  }
}

/**
 * Resolve whether the requesting user may view analytics for this venue.
 * Allowed if: platform admin, OR holds an active VenueRole carrying
 * VIEW_ANALYTICS / FULL_ACCESS for the venue (matched by Mongo _id or Place ID).
 * Returns { ok, venueName } or { ok: false }.
 */
async function authorizeVenueViewer(userId, venueId) {
  const user = await User.findById(userId).select('role');
  if (!user) return { ok: false };
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return { ok: true };

  // Resolve the venue's Mongo _id (VenueRole keys by ObjectId; the app keys
  // check-ins by Place ID, so accept either).
  let venueMongoId = null;
  let venueName;
  if (/^[0-9a-fA-F]{24}$/.test(venueId)) {
    const v = await Venue.findById(venueId).select('name');
    if (v) { venueMongoId = v._id; venueName = v.name; }
  }
  if (!venueMongoId) {
    const v = await Venue.findOne({ googlePlaceId: venueId }).select('name');
    if (v) { venueMongoId = v._id; venueName = v.name; }
  }
  if (!venueMongoId) return { ok: false };

  const role = await VenueRole.findOne({
    venueId: venueMongoId,
    userId,
    isActive: true,
    permissions: { $in: ['VIEW_ANALYTICS', 'FULL_ACCESS'] },
  });
  return { ok: !!role, venueName };
}

/**
 * GET /api/v1/venues/:venueId/analytics?tz=America/New_York
 * Auth: Bearer token; caller must be admin or a VIEW_ANALYTICS role holder.
 */
exports.getVenueAnalytics = async (req, res) => {
  const { venueId } = req.params;
  const tz = typeof req.query.tz === 'string' && req.query.tz ? req.query.tz : 'America/New_York';

  try {
    const auth = await authorizeVenueViewer(req.user.id, venueId);
    if (!auth.ok) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this venue' });
    }

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * DAY_MS);
    const d30 = new Date(now.getTime() - 30 * DAY_MS);
    const d14 = new Date(now.getTime() - 13 * DAY_MS); // 14 buckets incl. today

    // ---- Check-in metrics (one pass over the venue's check-in log) ----
    const [facet] = await CheckIn.aggregate([
      { $match: { venueId } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                allTime: { $sum: 1 },
                last7d: { $sum: { $cond: [{ $gte: ['$createdAt', d7] }, 1, 0] } },
                last30d: { $sum: { $cond: [{ $gte: ['$createdAt', d30] }, 1, 0] } },
                firstVisits30d: {
                  $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', d30] }, '$isFirstVisit'] }, 1, 0] },
                },
              },
            },
          ],
          unique7d: [
            { $match: { createdAt: { $gte: d7 } } },
            { $group: { _id: '$userId' } },
            { $count: 'n' },
          ],
          peakHours: [
            { $match: { createdAt: { $gte: d30 } } },
            { $group: { _id: { $hour: { date: '$createdAt', timezone: tz } }, count: { $sum: 1 } } },
          ],
          dailyTrend: [
            { $match: { createdAt: { $gte: d14 } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const counts = facet.counts[0] || { allTime: 0, last7d: 0, last30d: 0, firstVisits30d: 0 };
    const uniqueVisitors7d = facet.unique7d[0]?.n || 0;

    // Peak hours → dense 24-length array (index = hour of day in tz).
    const peakByHour = new Array(24).fill(0);
    for (const row of facet.peakHours) {
      if (typeof row._id === 'number') peakByHour[row._id] = row.count;
    }
    const peakHour = peakByHour.reduce((best, c, h) => (c > peakByHour[best] ? h : best), 0);

    // Daily trend → contiguous last-14-days, gaps zero-filled, today derived.
    const trendMap = new Map(facet.dailyTrend.map((r) => [r._id, r.count]));
    const todayStr = tzDateString(now, tz);
    const dailyTrend = [];
    for (let i = 13; i >= 0; i--) {
      const ds = tzDateString(new Date(now.getTime() - i * DAY_MS), tz);
      dailyTrend.push({ date: ds, count: trendMap.get(ds) || 0 });
    }
    const today = trendMap.get(todayStr) || 0;

    const returning30d = counts.last30d - counts.firstVisits30d;

    // ---- Community + tier distribution (from user badges) ----
    const tierAgg = await User.aggregate([
      { $unwind: '$badges' },
      { $match: { 'badges.venueId': venueId } },
      { $group: { _id: '$badges.badgeType', count: { $sum: 1 } } },
    ]);
    const tierDistribution = { GUEST: 0, REGULAR: 0, PLATINUM: 0, WHALE: 0 };
    let communitySize = 0;
    for (const row of tierAgg) {
      if (row._id in tierDistribution) tierDistribution[row._id] = row.count;
      communitySize += row.count;
    }

    // ---- Ticket click-throughs + events Nox is driving ----
    const [eventAgg] = await Event.aggregate([
      { $match: { venueId } },
      {
        $group: {
          _id: null,
          ticketTaps: { $sum: { $ifNull: ['$ticketTaps', 0] } },
          totalEvents: { $sum: 1 },
          upcomingEvents: { $sum: { $cond: [{ $gte: ['$date', now] }, 1, 0] } },
        },
      },
    ]);
    const events = eventAgg || { ticketTaps: 0, totalEvents: 0, upcomingEvents: 0 };

    return res.json({
      success: true,
      data: {
        venueId,
        venueName: auth.venueName || undefined,
        timezone: tz,
        generatedAt: now.toISOString(),
        checkIns: {
          today,
          last7d: counts.last7d,
          last30d: counts.last30d,
          allTime: counts.allTime,
          uniqueVisitors7d,
          newVisitors30d: counts.firstVisits30d,
          returningVisitors30d: returning30d < 0 ? 0 : returning30d,
        },
        peak: { hour: peakHour, byHour: peakByHour },
        dailyTrend,
        community: { size: communitySize, tiers: tierDistribution },
        tickets: {
          taps: events.ticketTaps || 0,
          totalEvents: events.totalEvents || 0,
          upcomingEvents: events.upcomingEvents || 0,
        },
      },
    });
  } catch (err) {
    console.error('[getVenueAnalytics] error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load analytics' });
  }
};
