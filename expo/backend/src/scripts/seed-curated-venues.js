/**
 * Seed curated launch venues.
 *
 * For each real venue we name, resolve accurate location data via Google Places
 * Find Place (coordinates, place_id, photo, address) — Google's LOCATION data is
 * reliable; only its category guessing is broken. We assign the correct TYPE
 * ourselves. Result: real bars/clubs, correctly typed, independent of Google's
 * noisy night_club tagging.
 *
 * Markets: UMD (College Park), UMBC/Baltimore (Fells Point + Federal Hill +
 * Power Plant Live), and DC (Dupont Circle + U Street clubs) — where UMD/UMBC
 * students actually go out.
 *
 * Idempotent: upserts by resolved googlePlaceId. Closed/unfound venues are
 * skipped and reported. Run:
 *   heroku run node src/scripts/seed-curated-venues.js -a rork-api-prod
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Venue = require('../models/Venue');

const KEY = process.env.GOOGLE_MAPS_API_KEY;

// [search query, our TYPE, city, state, market tag]
const VENUES = [
  // ---- UMD · College Park, MD (bar-heavy strip) ----
  ["R.J. Bentley's Filling Station College Park MD", 'BAR', 'College Park', 'MD', 'UMD'],
  ['Cornerstone Grill and Loft College Park MD', 'BAR', 'College Park', 'MD', 'UMD'],
  ["Looney's Pub College Park MD", 'BAR', 'College Park', 'MD', 'UMD'],
  ['Bar Louie College Park MD', 'BAR', 'College Park', 'MD', 'UMD'],
  ['MilkBoy ArtHouse College Park MD', 'CLUB', 'College Park', 'MD', 'UMD'],
  ['The Board and Brew College Park MD', 'BAR', 'College Park', 'MD', 'UMD'],

  // ---- Baltimore · Fells Point (UMBC crowd) ----
  ['The Horse You Came In On Saloon Baltimore MD', 'BAR', 'Baltimore', 'MD', 'BALT'],
  ["Cat's Eye Pub Fells Point Baltimore MD", 'BAR', 'Baltimore', 'MD', 'BALT'],
  ["Max's Taphouse Fells Point Baltimore MD", 'BAR', 'Baltimore', 'MD', 'BALT'],

  // ---- Baltimore · Power Plant Live + clubs ----
  ['Power Plant Live Baltimore MD', 'CLUB', 'Baltimore', 'MD', 'BALT'],
  ['Rams Head Live Baltimore MD', 'CLUB', 'Baltimore', 'MD', 'BALT'],
  ['Baltimore Soundstage Baltimore MD', 'CLUB', 'Baltimore', 'MD', 'BALT'],
  ['The 8x10 Baltimore MD', 'CLUB', 'Baltimore', 'MD', 'BALT'],

  // ---- Baltimore · Federal Hill (user-requested) ----
  ['Mothers Federal Hill Grille Baltimore MD', 'BAR', 'Baltimore', 'MD', 'FEDHILL'],
  ["Ryleigh's Oyster Federal Hill Baltimore MD", 'BAR', 'Baltimore', 'MD', 'FEDHILL'],
  ['Banditos Bar Federal Hill Baltimore MD', 'BAR', 'Baltimore', 'MD', 'FEDHILL'],
  ['Mad River Bar and Grille Federal Hill Baltimore MD', 'CLUB', 'Baltimore', 'MD', 'FEDHILL'],
  ['No Idea Tavern Federal Hill Baltimore MD', 'BAR', 'Baltimore', 'MD', 'FEDHILL'],
  ['Pickles Pub Baltimore MD', 'BAR', 'Baltimore', 'MD', 'FEDHILL'],

  // ---- DC · Dupont Circle (user-requested) ----
  ['The Front Page Dupont Circle Washington DC', 'BAR', 'Washington', 'DC', 'DC'],
  ['Public Bar Live Dupont Circle Washington DC', 'CLUB', 'Washington', 'DC', 'DC'],
  ["Mackey's Public House Washington DC", 'BAR', 'Washington', 'DC', 'DC'],
  ['Buffalo Billiards Dupont Washington DC', 'BAR', 'Washington', 'DC', 'DC'],
  ['Lucky Bar Dupont Circle Washington DC', 'BAR', 'Washington', 'DC', 'DC'],

  // ---- DC · U Street / club corridor (where students go to actually club) ----
  ['Flash Nightclub Washington DC', 'CLUB', 'Washington', 'DC', 'DC'],
  ['DC9 Nightclub Washington DC', 'CLUB', 'Washington', 'DC', 'DC'],
  ['The Brixton U Street Washington DC', 'BAR', 'Washington', 'DC', 'DC'],
  ['Marvin Washington DC', 'BAR', 'Washington', 'DC', 'DC'],
  ['Echostage Washington DC', 'CLUB', 'Washington', 'DC', 'DC'],
  ['Soundcheck Washington DC', 'CLUB', 'Washington', 'DC', 'DC'],
];

async function findPlace(query) {
  const url = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
  const { data } = await axios.get(url, {
    params: {
      input: query,
      inputtype: 'textquery',
      fields: 'place_id,name,geometry,formatted_address,photos,business_status,types',
      key: KEY,
    },
    timeout: 10000,
  });
  const c = (data.candidates || [])[0];
  return c || null;
}

function photoUrl(ref) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${KEY}`;
}

(async () => {
  if (!KEY) { console.error('GOOGLE_MAPS_API_KEY not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);

  let seeded = 0, skipped = 0;
  const report = [];
  for (const [query, type, city, state, market] of VENUES) {
    try {
      const place = await findPlace(query);
      if (!place) { skipped++; report.push(`  SKIP (not found): ${query}`); continue; }
      if (place.business_status && place.business_status !== 'OPERATIONAL') {
        skipped++; report.push(`  SKIP (${place.business_status}): ${place.name}`); continue;
      }
      const loc = place.geometry?.location;
      if (!loc) { skipped++; report.push(`  SKIP (no geo): ${query}`); continue; }

      const img = place.photos?.[0]?.photo_reference ? photoUrl(place.photos[0].photo_reference) : undefined;
      await Venue.findOneAndUpdate(
        { googlePlaceId: place.place_id },
        {
          $set: {
            googlePlaceId: place.place_id,
            name: place.name,
            type,                       // OUR correct type, not Google's guess
            curated: true,
            status: 'ACTIVE',
            'location.latitude': loc.lat,
            'location.longitude': loc.lng,
            'location.address': place.formatted_address || '',
            'location.city': city,
            'location.state': state,
            'location.coordinates': { type: 'Point', coordinates: [loc.lng, loc.lat] },
            ...(img ? { imageUrl: img } : {}),
            tags: [market.toLowerCase()],
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      seeded++;
      report.push(`  ✓ ${type.padEnd(5)} ${place.name}  [${market}]`);
    } catch (e) {
      skipped++; report.push(`  ERR ${query}: ${e.message}`);
    }
  }

  console.log(`\n=== curated seed: ${seeded} seeded, ${skipped} skipped ===`);
  report.forEach((r) => console.log(r));
  console.log(`\ncurated venues in DB: ${await Venue.countDocuments({ curated: true })}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
