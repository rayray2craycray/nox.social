/**
 * Auto-seed curated venues by NIGHTLIFE DISTRICT.
 *
 * Instead of hand-listing venue names (slow, fuzzy-matches wrong), we search a
 * TIGHT radius around each known nightlife strip. In a 500-900m circle over
 * Federal Hill / Fells Point / the College Park bar strip / Dupont, Google's
 * results are overwhelmingly the real bars & clubs — the restaurant-noise that
 * plagued city-wide searches mostly vanishes because we're already in the zone.
 *
 * Each result is filtered (same nightlife rules as the live proxy) and typed by
 * us (CLUB when night_club is primary / name signals a club; LOUNGE by name;
 * else BAR), then upserted as a curated venue. Reusable: add a district to grow
 * a city. Run:
 *   heroku run node src/scripts/seed-districts.js -a rork-api-prod
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Venue = require('../models/Venue');

const KEY = process.env.GOOGLE_MAPS_API_KEY;

// [label, lat, lng, radius(m), city, state, market]
const DISTRICTS = [
  ['College Park strip (UMD)', 38.9807, -76.9369, 1600, 'College Park', 'MD', 'UMD'],
  ['Fells Point', 39.2823, -76.5929, 850, 'Baltimore', 'MD', 'BALT'],
  ['Federal Hill', 39.2769, -76.6126, 950, 'Baltimore', 'MD', 'FEDHILL'],
  ['Power Plant Live / Inner Harbor', 39.2866, -76.6063, 650, 'Baltimore', 'MD', 'BALT'],
  ['Dupont Circle', 38.9097, -77.0434, 900, 'Washington', 'DC', 'DC'],
  ['U Street corridor', 38.9169, -77.0281, 1200, 'Washington', 'DC', 'DC'],
  ['Adams Morgan', 38.9219, -77.0422, 800, 'Washington', 'DC', 'DC'],
  ['H Street NE', 38.9000, -76.9915, 1100, 'Washington', 'DC', 'DC'],
];

// Reuse the live proxy's nightlife rules so auto-curated venues match map logic.
const ALLOW = new Set(['bar', 'night_club']);
const DENY = new Set([
  'gym', 'spa', 'hair_care', 'beauty_salon', 'lodging', 'gas_station', 'hospital',
  'school', 'bank', 'supermarket', 'pharmacy', 'doctor', 'church', 'place_of_worship',
  'park', 'shopping_mall', 'store', 'meal_takeaway', 'meal_delivery', 'cafe', 'bakery',
]);
const NAME_DENY = /\b(country club|golf|pilates|yoga|barber|nail salon|nail bar|spa|salon|fitness|crossfit|cigar)\b/i;
const CHAIN_DENY = /\b(applebee|olive garden|chili'?s|tgi ?friday|buffalo wild wings|outback|red lobster|denny'?s|ihop|cheesecake factory|texas roadhouse|longhorn|red robin|cracker barrel|panera|chipotle|mcdonald|wendy'?s|taco bell|burger king|hooters|dave ?& ?buster)\b/i;

function isNightlife(p) {
  const t = p.types || [];
  if (!t.some((x) => ALLOW.has(x))) return false;
  if (t.some((x) => DENY.has(x))) return false;
  if (NAME_DENY.test(p.name || '') || CHAIN_DENY.test(p.name || '')) return false;
  if (p.business_status && p.business_status !== 'OPERATIONAL') return false;
  if (t[0] === 'restaurant' && !t.includes('night_club')) return false;
  return true;
}

// Our authoritative type. Tight-district searches make night_club-primary a
// reliable club signal; names catch the rest.
function pickType(p) {
  const t = p.types || [];
  const n = (p.name || '').toLowerCase();
  if (/\blounge\b/.test(n)) return 'LOUNGE';
  if (t[0] === 'night_club' || /\b(night ?club|nightclub|disco)\b/.test(n)) return 'CLUB';
  return 'BAR';
}

function photoUrl(ref) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${KEY}`;
}

async function searchDistrict(lat, lng, radius) {
  const out = [];
  for (const type of ['bar', 'night_club']) {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: { location: `${lat},${lng}`, radius, type, key: KEY },
      timeout: 10000,
    });
    if (data.status === 'OK') out.push(...(data.results || []));
  }
  return out;
}

(async () => {
  if (!KEY) { console.error('GOOGLE_MAPS_API_KEY not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);

  const seenPlace = new Set();
  let total = 0;
  for (const [label, lat, lng, radius, city, state, market] of DISTRICTS) {
    const places = await searchDistrict(lat, lng, radius);
    let n = 0;
    for (const p of places) {
      if (seenPlace.has(p.place_id)) continue;
      if (!isNightlife(p)) continue;
      seenPlace.add(p.place_id);
      const loc = p.geometry?.location;
      if (!loc) continue;
      const img = p.photos?.[0]?.photo_reference ? photoUrl(p.photos[0].photo_reference) : undefined;
      await Venue.findOneAndUpdate(
        { googlePlaceId: p.place_id },
        {
          $set: {
            googlePlaceId: p.place_id,
            name: p.name,
            type: pickType(p),
            curated: true,
            status: 'ACTIVE',
            'location.latitude': loc.lat,
            'location.longitude': loc.lng,
            'location.address': p.vicinity || '',
            'location.city': city,
            'location.state': state,
            'location.coordinates': { type: 'Point', coordinates: [loc.lng, loc.lat] },
            ...(img ? { imageUrl: img } : {}),
            tags: [market.toLowerCase()],
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      n++; total++;
    }
    console.log(`  ${label.padEnd(34)} +${n} venues`);
  }
  console.log(`\n=== districts seeded: ${total} venues ===`);
  console.log(`curated venues in DB: ${await Venue.countDocuments({ curated: true })}`);
  const byType = await Venue.aggregate([{ $match: { curated: true } }, { $group: { _id: '$type', n: { $sum: 1 } } }]);
  console.log('by type:', byType.map((x) => `${x._id}:${x.n}`).join('  '));
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
