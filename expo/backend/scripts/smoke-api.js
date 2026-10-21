#!/usr/bin/env node
/**
 * Core-loop API smoke test — exercises the real deployed endpoints end-to-end
 * and reports pass/fail. Formalizes the manual curl checks into one runnable.
 *
 * Usage:
 *   node scripts/smoke-api.js                 # against production
 *   API=http://localhost:3000/api node scripts/smoke-api.js
 *
 * Creates two throwaway @nox.smoke accounts, runs the loop, cleans itself up by
 * deleting them (DELETE /auth/me). No external deps — Node 18+ global fetch.
 * Non-zero exit on any failure (CI-friendly).
 */
const API = process.env.API || 'https://rork-api-prod-3a4b8043e7dd.herokuapp.com/api';

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

(async () => {
  console.log(`\n=== Nox core-loop API smoke test ===\n${API}\n`);
  const stamp = Date.now();
  const a = { email: `smoke-a-${stamp}@nox.smoke`, password: 'Smoke1234!', displayName: 'Smoke A' };
  const b = { email: `smoke-b-${stamp}@nox.smoke`, password: 'Smoke1234!', displayName: 'Smoke B' };
  let tokA, tokB, idA, idB;

  // --- Auth ---
  console.log('Auth');
  let r = await req('POST', '/auth/signup', { body: a });
  tokA = r.json?.data?.accessToken;
  check('signup A', r.status === 201 && !!tokA, `status ${r.status}`);
  r = await req('POST', '/auth/signup', { body: b });
  tokB = r.json?.data?.accessToken;
  check('signup B', !!tokB);
  r = await req('POST', '/auth/signin', { body: { email: a.email, password: a.password } });
  check('signin A', r.status === 200 && !!r.json?.data?.accessToken);
  r = await req('GET', '/auth/me', { token: tokA });
  idA = r.json?.data?.id;
  check('GET /auth/me', r.status === 200 && !!idA, `name ${r.json?.data?.displayName}`);
  r = await req('GET', '/auth/me', { token: tokB });
  idB = r.json?.data?.id;
  check('me has savedEvents array', Array.isArray(r.json?.data?.savedEvents));

  // --- Check-in + tiers (far → TOO_FAR; near → visit) ---
  console.log('\nCheck-in + tiers');
  r = await req('POST', '/auth/me/checkin', {
    token: tokA,
    body: { venueId: 'smoke-venue', venueName: 'Smoke Venue', latitude: 0, longitude: 0, venueLat: 40, venueLng: -74 },
  });
  check('checkin far → TOO_FAR 403', r.status === 403 && r.json?.error === 'TOO_FAR');
  r = await req('POST', '/auth/me/checkin', {
    token: tokA,
    body: { venueId: 'smoke-venue', venueName: 'Smoke Venue', latitude: 40, longitude: -74, venueLat: 40, venueLng: -74 },
  });
  check('checkin near → visit 1 GUEST', r.json?.data?.visitCount === 1 && r.json?.data?.currentTier === 'GUEST');
  r = await req('POST', '/auth/me/checkin', {
    token: tokA,
    body: { venueId: 'smoke-venue', venueName: 'Smoke Venue', latitude: 40, longitude: -74, venueLat: 40, venueLng: -74 },
  });
  check('checkin same day → newVisit false', r.json?.data?.newVisit === false);

  // --- Saved events (My Night) ---
  console.log('\nSaved events');
  r = await req('POST', '/auth/me/saved-events/smoke-evt-1', { token: tokA });
  check('save event', r.json?.success && r.json?.data?.savedEvents?.some((s) => s.eventId === 'smoke-evt-1'));
  r = await req('POST', '/auth/me/saved-events/smoke-evt-1', { token: tokA });
  check('save idempotent (no dupe)', r.json?.data?.savedEvents?.filter((s) => s.eventId === 'smoke-evt-1').length === 1);
  r = await req('DELETE', '/auth/me/saved-events/smoke-evt-1', { token: tokA });
  check('unsave event', !r.json?.data?.savedEvents?.some((s) => s.eventId === 'smoke-evt-1'));

  // --- Social: search, follow, friends, getUserById ---
  console.log('\nSocial');
  r = await req('GET', '/social/users/search?q=Smoke', { token: tokA });
  check('user search', r.status === 200 && Array.isArray(r.json?.data));
  r = await req('POST', `/social/follow/${idB}`, { token: tokA });
  check('follow B', r.json?.success === true);
  r = await req('GET', '/social/friends', { token: tokA });
  check('friends list shows B w/ profile', r.json?.data?.some((f) => f.id === idB && f.displayName));
  r = await req('GET', `/social/users/${idB}`, { token: tokA });
  check('getUserById', r.status === 200 && r.json?.data?.displayName === 'Smoke B');
  r = await req('DELETE', `/social/follow/${idB}`, { token: tokA });
  check('unfollow B', r.json?.success === true);

  // --- Moderation: block/blocked/unblock ---
  console.log('\nModeration');
  r = await req('POST', '/moderation/block', { token: tokA, body: { userId: idB } });
  check('block B', r.status === 200 || r.status === 201);
  r = await req('GET', '/moderation/blocked', { token: tokA });
  check('blocked list', r.status === 200 && Array.isArray(r.json?.data));
  r = await req('DELETE', `/moderation/block/${idB}`, { token: tokA });
  check('unblock B', r.status === 200);

  // --- Chat unread ---
  console.log('\nChat');
  const ch = `smoke-chan-${stamp}`;
  await req('POST', `/chat/channels/${ch}/messages`, { token: tokB, body: { content: 'hi' } });
  r = await req('POST', '/chat/unread-counts', { token: tokA, body: { channelIds: [ch] } });
  check('unread counts (B msg visible to A)', r.json?.counts?.[ch] >= 1);
  await req('POST', `/chat/channels/${ch}/read`, { token: tokA });
  r = await req('POST', '/chat/unread-counts', { token: tokA, body: { channelIds: [ch] } });
  check('mark read → 0', r.json?.counts?.[ch] === 0);

  // --- Venue analytics gate + member counts + waitlist ---
  console.log('\nVenue + misc');
  r = await req('GET', '/v1/venues/smoke-venue/analytics', { token: tokA });
  check('analytics gated (403 for non-manager)', r.status === 403);
  r = await req('POST', '/v1/venues/member-counts', { token: tokA, body: { venueIds: ['smoke-venue'] } });
  check('member counts', r.json?.success && typeof r.json?.counts === 'object');
  r = await req('GET', '/venues/roles', { token: tokA });
  check('venue roles (fixed path, 200)', r.status === 200);
  r = await req('POST', '/waitlist', { body: { email: `wl-${stamp}@nox.smoke`, city: 'College Park' } });
  check('waitlist signup', r.json?.success === true);

  // --- Curated venues present (launch data) ---
  r = await req('GET', '/v1/venues/nearby?latitude=38.9897&longitude=-76.9378&radius=15000');
  const curated = (r.json?.results || []).filter((v) => v.curated);
  check('curated DMV venues on map', curated.length > 0, `${curated.length} curated`);

  // --- Cleanup ---
  console.log('\nCleanup');
  r = await req('DELETE', '/auth/me', { token: tokA });
  check('delete A', r.status === 200 || r.status === 204);
  r = await req('DELETE', '/auth/me', { token: tokB });
  check('delete B', r.status === 200 || r.status === 204);

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
