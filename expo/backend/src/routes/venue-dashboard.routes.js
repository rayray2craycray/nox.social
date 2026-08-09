/**
 * Venue Dashboard (magic-link web page)
 *
 * Public, user-facing HTML — the live analytics page a venue owner opens from
 * the link you texted them. No login: the signed token in the URL IS the
 * authorization (see venueLink.utils). Rendered server-side with the venue's
 * live numbers injected, so there's no follow-up CORS/API call from the page.
 *
 * Mounted at '/' (outside '/api') so the URL reads nox…/venue/<token>.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { verifyVenueToken } = require('../utils/venueLink.utils');
const { computeVenueAnalytics } = require('../services/analytics.service');

const router = express.Router();

const TEMPLATE = fs.readFileSync(path.join(__dirname, '../views/venue-dashboard.html'), 'utf8');

const INVALID_PAGE = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nox · Link expired</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08080c;color:#ececf5;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px}
.c{max-width:420px}h1{font-size:22px;margin:0 0 10px}p{color:#9a9aab;line-height:1.6}
.b{width:34px;height:34px;border-radius:10px;margin:0 auto 20px;display:grid;place-items:center;font-weight:800;color:#fff;
background:linear-gradient(140deg,#ff2d78,#a855f7)}</style></head>
<body><div class="c"><div class="b">N</div><h1>This report link has expired</h1>
<p>Venue report links are time-limited for privacy. Ask your Nox contact for a fresh link.</p></div></body></html>`;

// GET /venue/:token — render the venue's live dashboard.
router.get('/venue/:token', async (req, res) => {
  const claims = verifyVenueToken(req.params.token);
  if (!claims) {
    return res.status(401).type('html').send(INVALID_PAGE);
  }
  try {
    const tz =
      typeof req.query.tz === 'string' && req.query.tz ? req.query.tz : claims.tz;
    const data = await computeVenueAnalytics(claims.venueId, tz);
    // Inject as a JS object literal; escape '<' so the payload can't break out
    // of the <script> element.
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    const html = TEMPLATE.replace('"__NOX_DATA__"', json);
    return res.type('html').send(html);
  } catch (err) {
    console.error('[venue-dashboard] render error:', err);
    return res.status(500).type('html').send(INVALID_PAGE);
  }
});

module.exports = router;
