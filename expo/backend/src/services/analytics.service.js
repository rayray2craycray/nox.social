/**
 * Analytics Service
 *
 * Single source of truth for venue analytics. Both the role-gated API endpoint
 * (analytics.controller) and the magic-link web dashboard call
 * computeVenueAnalytics() so the two surfaces can never drift.
 *
 * All numbers are REAL and aggregate-only:
 *   - CheckIn log      → attendance (counts, unique visitors, peak, trend)
 *   - User.badges      → community size + tier distribution
 *   - Event.ticketTaps → ticket click-throughs Nox drove to the venue's seller
 */

const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Event = require('../models/Event.model');
const Venue = require('../models/Venue');

const DAY_MS = 24 * 60 * 60 * 1000;

function tzDateString(date, tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(date);
  }
}

// Resolve a display name for a venue keyed by Mongo _id or googlePlaceId.
async function resolveVenueName(venueId) {
  try {
    if (/^[0-9a-fA-F]{24}$/.test(venueId)) {
      const v = await Venue.findById(venueId).select('name');
      if (v) return v.name;
    }
    const v = await Venue.findOne({ googlePlaceId: venueId }).select('name');
    return v ? v.name : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} venueId  Place ID or Mongo _id string (as stored on check-ins).
 * @param {string} tz       IANA timezone for day/hour bucketing.
 * @returns {Promise<object>} dashboard-ready analytics payload.
 */
async function computeVenueAnalytics(venueId, tz = 'America/New_York') {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * DAY_MS);
  const d30 = new Date(now.getTime() - 30 * DAY_MS);
  const d60 = new Date(now.getTime() - 60 * DAY_MS);
  const d14 = new Date(now.getTime() - 13 * DAY_MS); // 14 buckets incl. today

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
              // Previous 30-day window (day 30..60 ago) for a trend delta.
              prev30d: {
                $sum: {
                  $cond: [
                    { $and: [{ $gte: ['$createdAt', d60] }, { $lt: ['$createdAt', d30] }] },
                    1,
                    0,
                  ],
                },
              },
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
        unique30d: [
          { $match: { createdAt: { $gte: d30 } } },
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

  const counts = facet.counts[0] || {
    allTime: 0, last7d: 0, last30d: 0, prev30d: 0, firstVisits30d: 0,
  };
  const uniqueVisitors7d = facet.unique7d[0]?.n || 0;
  const uniqueVisitors30d = facet.unique30d[0]?.n || 0;

  const peakByHour = new Array(24).fill(0);
  for (const row of facet.peakHours) {
    if (typeof row._id === 'number') peakByHour[row._id] = row.count;
  }
  const peakHour = peakByHour.reduce((best, c, h) => (c > peakByHour[best] ? h : best), 0);

  const trendMap = new Map(facet.dailyTrend.map((r) => [r._id, r.count]));
  const todayStr = tzDateString(now, tz);
  const dailyTrend = [];
  for (let i = 13; i >= 0; i--) {
    const ds = tzDateString(new Date(now.getTime() - i * DAY_MS), tz);
    dailyTrend.push({ date: ds, count: trendMap.get(ds) || 0 });
  }
  const today = trendMap.get(todayStr) || 0;

  const returning30d = counts.last30d - counts.firstVisits30d;
  // 30-day-over-previous-30-day change, as a signed percent (null if no base).
  const change30dPct =
    counts.prev30d > 0
      ? Math.round(((counts.last30d - counts.prev30d) / counts.prev30d) * 100)
      : null;

  // Community + tier distribution from badges.
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

  // Ticket click-throughs + events.
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

  const venueName = await resolveVenueName(venueId);

  return {
    venueId,
    venueName: venueName || undefined,
    timezone: tz,
    generatedAt: now.toISOString(),
    hasData: counts.allTime > 0,
    checkIns: {
      today,
      last7d: counts.last7d,
      last30d: counts.last30d,
      allTime: counts.allTime,
      change30dPct,
      uniqueVisitors7d,
      uniqueVisitors30d,
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
  };
}

module.exports = { computeVenueAnalytics };
