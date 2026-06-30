/**
 * Payments Controller
 *
 * Stripe payment intent creation + webhook handler. The webhook is the
 * source of truth for "was this ticket paid for" — never trust the client.
 *
 * Flow:
 *   1. Client POSTs to /api/payments/intent with { eventId, tierId }
 *   2. Backend creates a Stripe PaymentIntent and a Ticket with
 *      paymentStatus='PENDING' + stripePaymentIntentId set
 *   3. Backend returns { clientSecret, ticketId } to client
 *   4. Client confirms the payment in Stripe.js using clientSecret
 *   5. Stripe calls our webhook with payment_intent.succeeded → we mark
 *      the ticket PAID, increment sold counts, return 200
 */

const Stripe = require('stripe');
const Ticket = require('../models/Ticket.model');
const TicketTier = require('../models/TicketTier.model');
const Event = require('../models/Event.model');

// Lazy-init Stripe so server can boot even without a key (dev/CI).
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  if (!getStripe._cached) {
    getStripe._cached = Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return getStripe._cached;
}

/**
 * POST /api/payments/intent
 * Body: { eventId, tierId }
 * Auth required. Creates a PaymentIntent + a PENDING Ticket. Returns the
 * Stripe clientSecret so the client can confirm in Stripe.js.
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const { eventId, tierId } = req.body || {};
    if (!eventId || !tierId) {
      return res.status(400).json({
        success: false,
        error: 'eventId and tierId are required',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    if (event.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: 'Event is not available for purchase',
      });
    }

    const tier = await TicketTier.findById(tierId);
    if (!tier) {
      return res.status(404).json({ success: false, error: 'Tier not found' });
    }
    if (String(tier.eventId) !== String(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'Tier does not belong to event',
      });
    }
    if (tier.sold >= tier.quantity) {
      return res.status(400).json({ success: false, error: 'Sold out' });
    }

    let stripe;
    try {
      stripe = getStripe();
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: 'Payments not configured',
      });
    }

    // Create the PaymentIntent. amount is in cents per Stripe convention.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(tier.price * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        eventId: String(eventId),
        tierId: String(tierId),
        userId: String(userId),
      },
    });

    // Reserve a PENDING ticket so we can match the webhook back to it. We
    // do NOT increment tier.sold yet — that happens when the webhook
    // confirms payment, otherwise abandoned checkouts inflate sold counts.
    const ticket = await Ticket.create({
      eventId,
      userId,
      tierId,
      purchaseDetails: {
        amount: tier.price,
        currency: 'USD',
        paymentMethod: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'PENDING',
      },
    });

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        ticketId: ticket._id,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (err) {
    console.error('[createPaymentIntent] error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      message: err.message,
    });
  }
};

/**
 * POST /webhooks/stripe
 * Stripe webhook handler. NO auth (Stripe calls us directly), but the
 * request is authenticated via signature header. This route MUST receive
 * the raw request body (express.raw) — Express's JSON parser breaks
 * signature verification because it re-serializes the body.
 *
 * Returns 200 quickly. Any 4xx/5xx triggers Stripe to retry with exp backoff.
 */
exports.stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not set');
    // Return 200 to avoid Stripe's retry loop during initial setup. We log
    // loudly so the misconfiguration is visible in Heroku logs.
    return res.status(200).send('webhook secret not configured');
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        // Stripe sends many event types; we only care about a few. Log the
        // rest so we know what we're ignoring without 4xx-ing them.
        console.log(`[stripe webhook] ignoring event type: ${event.type}`);
    }

    // Always 200 after handling — even if our processing failed, returning
    // non-2xx triggers Stripe retries which is rarely what we want.
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[stripe webhook] handler for ${event.type} threw:`, err);
    // Return 200 anyway. The job is to acknowledge receipt; failures are
    // logged for follow-up rather than retried automatically (which often
    // makes the underlying bug worse, e.g., double-marking tickets).
    return res.status(200).json({ received: true, processed: false });
  }
};

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handlePaymentSucceeded(paymentIntent) {
  const ticket = await Ticket.findOne({
    'purchaseDetails.stripePaymentIntentId': paymentIntent.id,
  });
  if (!ticket) {
    console.warn(
      `[stripe webhook] payment_intent.succeeded for ${paymentIntent.id} ` +
        'but no matching ticket — orphaned charge?'
    );
    return;
  }

  // Idempotent: if we've already marked this ticket paid (Stripe sometimes
  // delivers webhooks more than once), skip.
  if (ticket.purchaseDetails.paymentStatus === 'PAID') {
    console.log(`[stripe webhook] ticket ${ticket._id} already PAID; skipping`);
    return;
  }

  ticket.purchaseDetails.paymentStatus = 'PAID';
  ticket.purchaseDetails.paidAt = new Date();
  ticket.purchaseDetails.transactionId = paymentIntent.id;
  await ticket.save();

  // Now that payment is confirmed, increment the sold counters.
  await TicketTier.findByIdAndUpdate(ticket.tierId, { $inc: { sold: 1 } });
  await Event.findByIdAndUpdate(ticket.eventId, { $inc: { ticketsSold: 1 } });

  console.log(`✅ Ticket ${ticket._id} marked PAID (intent ${paymentIntent.id})`);
}

async function handlePaymentFailed(paymentIntent) {
  const ticket = await Ticket.findOne({
    'purchaseDetails.stripePaymentIntentId': paymentIntent.id,
  });
  if (!ticket) return;

  ticket.purchaseDetails.paymentStatus = 'FAILED';
  ticket.status = 'CANCELLED';
  await ticket.save();
  console.log(`❌ Ticket ${ticket._id} CANCELLED — payment failed`);
}

async function handleRefund(charge) {
  // Refunds arrive as charge.refunded with the original payment_intent on
  // the charge object.
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  const ticket = await Ticket.findOne({
    'purchaseDetails.stripePaymentIntentId': paymentIntentId,
  });
  if (!ticket) return;

  ticket.purchaseDetails.paymentStatus = 'REFUNDED';
  ticket.purchaseDetails.refundedAt = new Date();
  ticket.status = 'REFUNDED';
  await ticket.save();

  // Roll back the sold counters so the seat is freed.
  await TicketTier.findByIdAndUpdate(ticket.tierId, { $inc: { sold: -1 } });
  await Event.findByIdAndUpdate(ticket.eventId, { $inc: { ticketsSold: -1 } });

  console.log(`💸 Ticket ${ticket._id} REFUNDED`);
}
