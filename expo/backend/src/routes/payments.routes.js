/**
 * Payments routes.
 *
 * Two endpoints, mounted differently:
 * - POST /api/payments/intent — authenticated, JSON body. Standard /api route.
 * - POST /webhooks/stripe — unauthenticated (signature-verified instead),
 *   requires the raw body bytes to verify against the stripe-signature
 *   header. Mounted separately in server.js with express.raw middleware
 *   that runs BEFORE the global express.json().
 */

const express = require('express');
const { createPaymentIntent, stripeWebhook } = require('../controllers/payments.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/intent', authMiddleware, createPaymentIntent);

// Export both: the intent router for normal /api mounting, and the webhook
// handler directly so server.js can wire express.raw() in front of it.
module.exports = router;
module.exports.stripeWebhook = stripeWebhook;
