/**
 * Waitlist Routes  (mounted at /api/waitlist)
 *
 * Public pre-launch signup from the nox.social waitlist page. Deduped by email;
 * sends a confirmation via the live email service (non-fatal). GET /count
 * returns the total for social proof ("join N others").
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const emailService = require('../services/email.service');

const router = express.Router();

// POST /api/waitlist  { email, city? }
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
    body('city').optional().isString().trim().isLength({ max: 80 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, city } = req.body;
    try {
      const existing = await Waitlist.findOne({ email });
      if (existing) {
        return res.json({ success: true, alreadyOnList: true });
      }

      await Waitlist.create({ email, city: city || null, source: 'waitlist' });

      // Fire-and-forget confirmation — a mail hiccup must not fail the signup.
      emailService
        .sendWaitlistConfirmation(email, city)
        .catch((err) => console.error('[waitlist] confirmation email failed:', err.message));

      return res.status(201).json({ success: true, alreadyOnList: false });
    } catch (err) {
      // Unique-index race → treat as already on the list.
      if (err && err.code === 11000) {
        return res.json({ success: true, alreadyOnList: true });
      }
      console.error('[waitlist] signup error:', err);
      return res.status(500).json({ success: false, error: 'Could not join the waitlist' });
    }
  }
);

// GET /api/waitlist/count → { count }
router.get('/count', async (_req, res) => {
  try {
    const count = await Waitlist.countDocuments();
    return res.json({ success: true, count });
  } catch {
    return res.json({ success: true, count: 0 });
  }
});

module.exports = router;
