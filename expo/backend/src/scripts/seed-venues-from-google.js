/**
 * Venue Seeding Script — Google Places → MongoDB
 *
 * Pulls nightlife venues from Google Places nearbysearch for a list of
 * (city, lat, lng) targets and upserts them into the Venue collection.
 * Re-running is idempotent: existing venues are matched by googlePlaceId
 * and updated, not duplicated.
 *
 * USAGE:
 *   # local (set env vars first)
 *   MONGODB_URI=mongodb+srv://... GOOGLE_MAPS_API_KEY=... \
 *     node src/scripts/seed-venues-from-google.js
 *
 *   # on Heroku (one-off dyno — picks up env from the app's config vars)
 *   heroku run "node src/scripts/seed-venues-from-google.js" -a rork-api-prod
 *
 * To change the seed targets, edit TARGETS below.
 *
 * ENVIRONMENT:
 *   MONGODB_URI            (required) — Mongo connection string
 *   GOOGLE_MAPS_API_KEY    (required) — same key used by /venues/nearby
 *   SEED_DRY_RUN=true      (optional) — log inserts without writing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Venue = require('../models/Venue');

// ---------------------------------------------------------------------------
// Cities to seed. Add or remove as needed. Each entry seeds an 8 km radius
// (50_000 m = Google's max; 8 km keeps results tight to the city center).
// ---------------------------------------------------------------------------
const TARGETS = [
  { city: 'New York, NY',    state: 'NY', latitude: 40.7128, longitude: -74.0060 },
  { city: 'Los Angeles, CA', state: 'CA', latitude: 34.0522, longitude: -118.2437 },
  { city: 'Miami, FL',       state: 'FL', latitude: 25.7617, longitude: -80.1918 },
  { city: 'Chicago, IL',     state: 'IL', latitude: 41.8781, longitude: -87.6298 },
  { city: 'Las Vegas, NV',   state: 'NV', latitude: 36.1699, longitude: -115.1398 },
  { city: 'Austin, TX',      state: 'TX', latitude: 30.2672, longitude: -97.7431 },
];

const KEYWORDS = ['nightclub', 'bar', 'lounge', 'club'];
const RADIUS_METERS = 8000;
const DRY_RUN = process.env.SEED_DRY_RUN === 'true';

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------
function determineVenueType(types, name) {
  const n = (name || '').toLowerCase();
  if (n.includes('club') || n.includes('nightclub')) return 'CLUB';
  if (n.includes('lounge')) return 'LOUNGE';
  if (n.includes('bar') || n.includes('pub') || n.includes('tavern')) return 'BAR';
  if (Array.isArray(types) && types.includes('night_club')) return 'CLUB';
  if (Array.isArray(types) && types.includes('bar')) return 'BAR';
  return 'RESTAURANT';
}

function isNightlifeVenue(place) {
  const n = (place.name || '').toLowerCase();
  const types = (place.types || []).map((t) => t.toLowerCase());
  const keywordHit = KEYWORDS.some((k) => n.includes(k));
  const typeHit = types.some((t) => ['night_club', 'bar'].includes(t));
  const excluded = ['hospital', 'school', 'bank', 'store', 'supermarket'].some((t) =>
    types.includes(t)
  );
  return (keywordHit || typeHit) && !excluded;
}

// ---------------------------------------------------------------------------
// Fetch a single city's venues by trying each keyword and deduping
// ---------------------------------------------------------------------------
async function fetchVenuesForCity(target, apiKey) {
  const seen = new Map(); // place_id -> place
  for (const keyword of KEYWORDS) {
    try {
      const { data } = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${target.latitude},${target.longitude}`,
            radius: RADIUS_METERS,
            keyword,
            key: apiKey,
          },
          timeout: 15000,
        }
      );
      if (data.status !== 'OK') {
        console.warn(`[${target.city}] ${keyword}: status=${data.status} ${data.error_message || ''}`);
        continue;
      }
      for (const place of data.results || []) {
        if (!seen.has(place.place_id) && isNightlifeVenue(place)) {
          seen.set(place.place_id, place);
        }
      }
    } catch (err) {
      console.warn(`[${target.city}] ${keyword}: fetch failed —`, err.message);
    }
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Upsert one Google place into the Venue collection
// ---------------------------------------------------------------------------
async function upsertVenue(place, target) {
  const doc = {
    googlePlaceId: place.place_id,
    name: place.name,
    type: determineVenueType(place.types, place.name),
    location: {
      latitude: place.geometry?.location?.lat || 0,
      longitude: place.geometry?.location?.lng || 0,
      address: place.vicinity || place.formatted_address || target.city,
      city: target.city.split(',')[0].trim(),
      state: target.state,
      country: 'USA',
      coordinates: {
        type: 'Point',
        coordinates: [
          place.geometry?.location?.lng || 0,
          place.geometry?.location?.lat || 0,
        ],
      },
    },
    googleRating: place.rating,
    googleTotalRatings: place.user_ratings_total,
    priceLevel: place.price_level || 2,
    googlePhotoReferences: (place.photos || []).slice(0, 5).map((p) => p.photo_reference),
    status: 'ACTIVE',
  };

  if (DRY_RUN) {
    console.log(`  DRY-RUN would upsert: ${doc.name} (${doc.googlePlaceId})`);
    return { upserted: false };
  }

  const result = await Venue.updateOne(
    { googlePlaceId: place.place_id },
    { $set: doc, $setOnInsert: { vibeData: { music: 0, density: 0, energy: 0, waitTime: 0, totalVotes: 0 } } },
    { upsert: true }
  );
  return { upserted: result.upsertedCount > 0, modified: result.modifiedCount > 0 };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('FAIL: MONGODB_URI not set');
    process.exit(1);
  }
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('FAIL: GOOGLE_MAPS_API_KEY not set');
    process.exit(1);
  }

  console.log(`Seeding venues across ${TARGETS.length} cities. dry-run=${DRY_RUN}`);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Mongo connected');

  let totalSeen = 0;
  let totalUpserted = 0;
  let totalModified = 0;

  for (const target of TARGETS) {
    console.log(`\n=== ${target.city} ===`);
    const places = await fetchVenuesForCity(target, process.env.GOOGLE_MAPS_API_KEY);
    console.log(`  found ${places.length} nightlife venues from Google`);
    totalSeen += places.length;

    for (const place of places) {
      try {
        const { upserted, modified } = await upsertVenue(place, target);
        if (upserted) totalUpserted += 1;
        else if (modified) totalModified += 1;
      } catch (err) {
        console.warn(`  upsert failed for ${place.name}:`, err.message);
      }
    }
  }

  console.log(`\n=== summary ===`);
  console.log(`  fetched from Google: ${totalSeen}`);
  console.log(`  new inserts:         ${totalUpserted}`);
  console.log(`  existing updates:    ${totalModified}`);

  await mongoose.disconnect();
  console.log('✓ done');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
