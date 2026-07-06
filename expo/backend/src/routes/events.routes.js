const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation');
const { createEventSchema, updateEventSchema } = require('../validators/events.validator');

const eventsController = require('../controllers/events.controller');
const ticketsController = require('../controllers/tickets.controller');
const guestlistController = require('../controllers/guestlist.controller');

// ============================================
// PUBLIC ROUTES
// ============================================

// Events - Public routes for browsing
router.get('/', eventsController.getEvents);
// Alias used by the app's event list. Must be declared before /:eventId or
// Express matches 'upcoming' as an eventId and getEventById throws a
// CastError. getEvents already defaults to upcoming PUBLISHED events.
router.get('/upcoming', eventsController.getEvents);
router.get('/:eventId', eventsController.getEventById);
router.get('/venue/:venueId', eventsController.getVenueEvents);

// Tickets - Public route for QR code lookup
router.get('/tickets/qr/:qrCode', ticketsController.getTicketByQRCode);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

// Events Management (venue owners/admins only)
router.post('/', authMiddleware, validate(createEventSchema), eventsController.createEvent);
router.patch('/:eventId', authMiddleware, validate(updateEventSchema), eventsController.updateEvent);
router.delete('/:eventId', authMiddleware, eventsController.deleteEvent);

// Ticket Purchases and Management
router.post('/tickets/purchase', authMiddleware, ticketsController.purchaseTicket);
router.get('/tickets/user', authMiddleware, ticketsController.getUserTickets);
router.get('/tickets/:ticketId/wallet-pass', authMiddleware, ticketsController.getWalletPass);
router.post('/tickets/:ticketId/transfer', authMiddleware, ticketsController.transferTicket);
router.post('/tickets/:ticketId/cancel', authMiddleware, ticketsController.cancelTicket);

// Ticket Check-in (venue staff)
router.post('/tickets/checkin', authMiddleware, ticketsController.checkInTicket);

// Guest List Management (venue staff)
router.post('/guestlist/add', authMiddleware, guestlistController.addGuest);
router.get('/guestlist/venue/:venueId', authMiddleware, guestlistController.getVenueGuestList);
router.get('/guestlist/event/:eventId', authMiddleware, guestlistController.getEventGuestList);
router.post('/guestlist/:guestId/checkin', authMiddleware, guestlistController.checkInGuest);
router.post('/guestlist/:guestId/confirm', authMiddleware, guestlistController.confirmGuest);
router.post('/guestlist/:guestId/noshow', authMiddleware, guestlistController.markNoShow);
router.patch('/guestlist/:guestId', authMiddleware, guestlistController.updateGuest);
router.delete('/guestlist/:guestId', authMiddleware, guestlistController.removeGuest);
router.get('/guestlist/search', authMiddleware, guestlistController.searchGuestList);

module.exports = router;
