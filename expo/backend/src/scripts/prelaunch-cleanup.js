/**
 * Pre-launch cleanup — removes all dev/test artifacts so real users never see
 * the Nox Test Lounge, test event, or bot.
 *
 * SAFE BY DEFAULT: does nothing unless CONFIRM_CLEANUP=yes is set, so it can't
 * wipe the test rig while you're still testing a build.
 *
 * Run at launch:
 *   heroku run "CONFIRM_CLEANUP=yes node src/scripts/prelaunch-cleanup.js" -a rork-api-prod
 *   heroku config:set NOX_TEST_BOT=off -a rork-api-prod    # disable the chat bot
 *
 * Dry run (see what WOULD be removed, changes nothing):
 *   heroku run "node src/scripts/prelaunch-cleanup.js" -a rork-api-prod
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event.model');
const TicketTier = require('../models/TicketTier.model');
const Ticket = require('../models/Ticket.model');
const Message = require('../models/Message.model');

const CONFIRM = process.env.CONFIRM_CLEANUP === 'yes';
const TEST_VENUE_ID = 'nox-test-lounge';
const TEST_EVENT_TITLE = 'Nox Test Event (Stripe)';
const TEST_EMAILS = ['noxtester@nox.test', 'nox-chat-bot@example.com'];
const TEST_EMAIL_PATTERN = /@example\.com$/i; // throwaway accounts from testing

async function main() {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(CONFIRM ? '=== CLEANUP (live) ===' : '=== DRY RUN (set CONFIRM_CLEANUP=yes to apply) ===');

  const plan = [];

  // 1. Test events + their tiers + tickets
  const testEvents = await Event.find({
    $or: [{ title: TEST_EVENT_TITLE }, { venueId: TEST_VENUE_ID }],
  });
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

  // 2. Test accounts (explicit + @example.com pattern)
  const testUsers = await User.find({
    $or: [{ email: { $in: TEST_EMAILS } }, { email: TEST_EMAIL_PATTERN }],
  });
  for (const u of testUsers) {
    plan.push(`user ${u.email} (${u._id})`);
    if (CONFIRM) await User.deleteOne({ _id: u._id });
  }

  // 3. Strip the test-venue badge from any real users who earned it
  const badgeHolders = await User.find({ 'badges.venueId': TEST_VENUE_ID });
  for (const u of badgeHolders) {
    if (TEST_EMAILS.includes(u.email) || TEST_EMAIL_PATTERN.test(u.email)) continue; // already deleted
    plan.push(`strip "${TEST_VENUE_ID}" badge from real user ${u.email}`);
    if (CONFIRM) {
      u.badges = u.badges.filter((b) => b.venueId !== TEST_VENUE_ID);
      await u.save();
    }
  }

  // 4. Test-channel chat messages
  const msgCount = await Message.countDocuments({ channelId: `${TEST_VENUE_ID}-general` });
  if (msgCount > 0) {
    plan.push(`${msgCount} chat message(s) in ${TEST_VENUE_ID}-general`);
    if (CONFIRM) await Message.deleteMany({ channelId: `${TEST_VENUE_ID}-general` });
  }

  console.log(`\n${CONFIRM ? 'Removed' : 'Would remove'} ${plan.length} item group(s):`);
  plan.forEach((p) => console.log('  -', p));
  if (!CONFIRM) console.log('\nNothing changed. Re-run with CONFIRM_CLEANUP=yes to apply.');
  console.log('\nAlso remember: heroku config:set NOX_TEST_BOT=off  (disables the chat auto-reply bot)');

  await mongoose.disconnect();
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
