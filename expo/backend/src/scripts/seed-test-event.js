/**
 * Seed a single test event + ticket tier for verifying the Stripe purchase
 * flow end-to-end. Idempotent (upsert by a fixed title). Prints the tier id
 * so a client can create a payment intent against it.
 *
 * Run on Heroku: heroku run "node src/scripts/seed-test-event.js" -a rork-api-prod
 *
 * DEV-ONLY: delete this event before public launch (or leave it — it's a
 * $1 test tier tied to the Nox Test Lounge venue).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event.model');
const TicketTier = require('../models/TicketTier.model');

async function main() {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);

  const TITLE = 'Nox Test Event (Stripe)';
  let event = await Event.findOne({ title: TITLE });
  if (!event) {
    event = await Event.create({
      venueId: 'nox-test-lounge',
      venueName: 'Nox Test Lounge',
      title: TITLE,
      description: 'Test event for verifying Stripe ticket purchase.',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
      startTime: '21:00',
      endTime: '02:00',
      status: 'PUBLISHED',
      capacity: 1000,
    });
    console.log('created event', event._id.toString());
  } else {
    console.log('event exists', event._id.toString());
  }

  let tier = await TicketTier.findOne({ eventId: event._id, name: 'Test GA' });
  if (!tier) {
    tier = await TicketTier.create({
      eventId: event._id,
      name: 'Test GA',
      price: 1.00, // $1.00 test price
      quantity: 1000,
      sold: 0,
      type: 'GENERAL',
      salesWindow: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),      // opened yesterday
        end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),   // closes in 60d
      },
    });
    console.log('created tier', tier._id.toString());
  } else {
    console.log('tier exists', tier._id.toString());
  }

  console.log('\n=== USE THESE ===');
  console.log('eventId:', event._id.toString());
  console.log('tierId :', tier._id.toString());

  await mongoose.disconnect();
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
