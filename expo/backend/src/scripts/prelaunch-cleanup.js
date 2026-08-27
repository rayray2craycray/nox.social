/**
 * Pre-launch cleanup — removes dev/test artifacts so real users never see the
 * test rig, and (critically) removes MOCK EVENTS SEEDED ON REAL VENUES.
 *
 * SAFE BY DEFAULT: does nothing unless CONFIRM_CLEANUP=yes is set.
 *
 * TWO PHASES (because the App Store reviewer needs some of this data):
 *
 *   PHASE A — before PUBLIC launch (always run):
 *     Removes fake events seeded on REAL venues (Copacabana, etc.) + the old
 *     Stripe test event + throwaway @example.com accounts + test-lounge chat.
 *     KEEPS the demo venue / appreview account / demo events so App Store
 *     review still works.
 *       heroku run "CONFIRM_CLEANUP=yes node src/scripts/prelaunch-cleanup.js" -a rork-api-prod
 *
 *   PHASE B — AFTER App Store approval (add INCLUDE_REVIEW_DATA=yes):
 *     Also removes the demo venue "The Neon Room" (nox-demo-club) events, the
 *     appreview@nox.social reviewer account, and @nox-demo.internal demo users.
 *       heroku run "CONFIRM_CLEANUP=yes INCLUDE_REVIEW_DATA=yes node src/scripts/prelaunch-cleanup.js" -a rork-api-prod
 *
 * Dry run (changes nothing): drop CONFIRM_CLEANUP.
 * Also: heroku config:set NOX_TEST_BOT=off  (disables the chat auto-reply bot)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event.model');
const TicketTier = require('../models/TicketTier.model');
const Ticket = require('../models/Ticket.model');
const Message = require('../models/Message.model');
const CheckIn = require('../models/CheckIn');

const CONFIRM = process.env.CONFIRM_CLEANUP === 'yes';
const INCLUDE_REVIEW = process.env.INCLUDE_REVIEW_DATA === 'yes';

const TEST_VENUE_ID = 'nox-test-lounge';
const TEST_EVENT_TITLE = 'Nox Test Event (Stripe)';
const TEST_EMAILS = ['noxtester@nox.test', 'nox-chat-bot@example.com'];
const TEST_EMAIL_PATTERN = /@example\.com$/i;

// Mock events were seeded on these REAL venue Place IDs for workflow testing.
// These MUST go before public launch (fake events at real clubs).
const REAL_VENUE_MOCK_IDS = [
  'ChIJ69ryGfBYwokRtg42shcXW_M', // Copacabana Nightclub
  'ChIJRYx-LctZwokRUGvx8Rg1LQA', // Somewhere Nowhere NYC
  'ChIJr3BEnkZZwokRAo1rHPVk80M', // Nebula
  'ChIJYbxKJmlZwokRyaASxd_iOyw', // Outer Heaven
  'ChIJwS6UbYRZwokRV2-6w3CAVPE', // Rumpus Room
];

// Demo data used by App Store review — only removed in Phase B.
const DEMO_VENUE_ID = 'nox-demo-club';
const REVIEW_EMAIL = 'appreview@nox.social';
const DEMO_EMAIL_PATTERN = /@nox-demo\.internal$/i;

async function main() {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(CONFIRM ? '=== CLEANUP (live) ===' : '=== DRY RUN (set CONFIRM_CLEANUP=yes to apply) ===');
  console.log(INCLUDE_REVIEW ? '=== PHASE A + B (also removing review/demo data) ===' : '=== PHASE A only (keeping review/demo data) ===\n');

  const plan = [];

  // --- PHASE A ---

  // A1. Mock events on REAL venues (the misleading ones).
  const realMockEvents = await Event.find({ venueId: { $in: REAL_VENUE_MOCK_IDS } });
  if (realMockEvents.length) {
    plan.push(`${realMockEvents.length} mock event(s) on real venues (${REAL_VENUE_MOCK_IDS.length} venues)`);
    if (CONFIRM) {
      const ids = realMockEvents.map((e) => e._id);
      await Ticket.deleteMany({ eventId: { $in: ids } });
      await TicketTier.deleteMany({ eventId: { $in: ids } });
      await Event.deleteMany({ _id: { $in: ids } });
    }
  }

  // A2. Old Stripe test event + test-lounge events + their tiers/tickets.
  const testEvents = await Event.find({ $or: [{ title: TEST_EVENT_TITLE }, { venueId: TEST_VENUE_ID }] });
  for (const ev of testEvents) {
    const tiers = await TicketTier.countDocuments({ eventId: ev._id });
    const tix = await Ticket.countDocuments({ eventId: ev._id });
    plan.push(`event "${ev.title}" (${ev._id}) + ${tiers} tier(s) + ${tix} ticket(s)`);
    if (CONFIRM) {
      await Ticket.deleteMany({ eventId: ev._id });
      await TicketTier.deleteMany({ eventId: ev._id });
      await Event.deleteOne({ _id: ev._id });
    }
  }

  // A3. Throwaway @example.com test accounts.
  const testUsers = await User.find({ $or: [{ email: { $in: TEST_EMAILS } }, { email: TEST_EMAIL_PATTERN }] });
  for (const u of testUsers) {
    plan.push(`test user ${u.email} (${u._id})`);
    if (CONFIRM) await User.deleteOne({ _id: u._id });
  }

  // A4. Strip test-lounge + real-venue-mock badges from real users.
  const stripVenueIds = [TEST_VENUE_ID, ...REAL_VENUE_MOCK_IDS];
  const badgeHolders = await User.find({ 'badges.venueId': { $in: stripVenueIds } });
  for (const u of badgeHolders) {
    if (TEST_EMAILS.includes(u.email) || TEST_EMAIL_PATTERN.test(u.email)) continue;
    if (!INCLUDE_REVIEW && (u.email === REVIEW_EMAIL || DEMO_EMAIL_PATTERN.test(u.email))) continue; // keep for review
    plan.push(`strip test/real-mock badges from ${u.email}`);
    if (CONFIRM) {
      u.badges = u.badges.filter((b) => !stripVenueIds.includes(b.venueId));
      await u.save();
    }
  }

  // A5. Test-channel chat messages + CheckIn logs on mock real venues.
  const msgCount = await Message.countDocuments({ channelId: `${TEST_VENUE_ID}-general` });
  if (msgCount > 0) {
    plan.push(`${msgCount} chat message(s) in ${TEST_VENUE_ID}-general`);
    if (CONFIRM) await Message.deleteMany({ channelId: `${TEST_VENUE_ID}-general` });
  }
  const ciCount = await CheckIn.countDocuments({ venueId: { $in: REAL_VENUE_MOCK_IDS } });
  if (ciCount > 0) {
    plan.push(`${ciCount} check-in log(s) on real-venue mocks`);
    if (CONFIRM) await CheckIn.deleteMany({ venueId: { $in: REAL_VENUE_MOCK_IDS } });
  }

  // --- PHASE B (only with INCLUDE_REVIEW_DATA=yes) ---
  if (INCLUDE_REVIEW) {
    const demoEvents = await Event.find({ venueId: DEMO_VENUE_ID });
    if (demoEvents.length) {
      plan.push(`${demoEvents.length} demo-venue event(s) (${DEMO_VENUE_ID})`);
      if (CONFIRM) {
        const ids = demoEvents.map((e) => e._id);
        await Ticket.deleteMany({ eventId: { $in: ids } });
        await TicketTier.deleteMany({ eventId: { $in: ids } });
        await Event.deleteMany({ _id: { $in: ids } });
      }
    }
    const demoUsers = await User.find({ $or: [{ email: REVIEW_EMAIL }, { email: DEMO_EMAIL_PATTERN }] });
    for (const u of demoUsers) {
      plan.push(`demo/review user ${u.email} (${u._id})`);
      if (CONFIRM) await User.deleteOne({ _id: u._id });
    }
    const demoCi = await CheckIn.countDocuments({ venueId: DEMO_VENUE_ID });
    if (demoCi > 0) {
      plan.push(`${demoCi} demo-venue check-in log(s)`);
      if (CONFIRM) await CheckIn.deleteMany({ venueId: DEMO_VENUE_ID });
    }
  }

  console.log(`${CONFIRM ? 'Removed' : 'Would remove'} ${plan.length} item group(s):`);
  plan.forEach((p) => console.log('  -', p));
  if (!plan.length) console.log('  (nothing to remove)');
  if (!CONFIRM) console.log('\nNothing changed. Re-run with CONFIRM_CLEANUP=yes to apply.');
  console.log('\nAlso: heroku config:set NOX_TEST_BOT=off  (disables the chat auto-reply bot)');

  await mongoose.disconnect();
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
