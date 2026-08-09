/**
 * Venue magic-link tokens.
 *
 * A signed, expiring token that grants read-only access to ONE venue's
 * analytics web dashboard. Possession of the link is the authorization — this
 * is what you text a club owner so they can see their live numbers without an
 * app, a login, or an account. Signed with JWT_SECRET and scoped by a distinct
 * `purpose` claim so these tokens can never be used as auth tokens elsewhere.
 */

const jwt = require('jsonwebtoken');

const PURPOSE = 'venue-analytics';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
}

/**
 * @param {string} venueId
 * @param {{ days?: number, tz?: string }} opts
 * @returns {string} signed JWT
 */
function signVenueToken(venueId, opts = {}) {
  const days = opts.days || 30;
  return jwt.sign(
    { purpose: PURPOSE, venueId, tz: opts.tz || 'America/New_York' },
    getSecret(),
    { expiresIn: `${days}d` },
  );
}

/**
 * @returns {{ venueId: string, tz: string } | null} null if invalid/expired/wrong purpose.
 */
function verifyVenueToken(token) {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (decoded.purpose !== PURPOSE || !decoded.venueId) return null;
    return { venueId: decoded.venueId, tz: decoded.tz || 'America/New_York' };
  } catch {
    return null;
  }
}

/** Build the absolute dashboard URL for a token, honoring proxy headers. */
function dashboardUrl(req, token) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}/venue/${token}`;
}

module.exports = { signVenueToken, verifyVenueToken, dashboardUrl, PURPOSE };
