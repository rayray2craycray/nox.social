const express = require('express');
const router = express.Router();
const {
  getChannelMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
} = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Get messages for a channel (public - rate limited)
router.get('/channels/:channelId/messages', getChannelMessages);

// Send a message (authenticated)
router.post('/channels/:channelId/messages', authMiddleware, sendMessage);

// Edit a message (authenticated)
router.patch('/messages/:messageId', authMiddleware, editMessage);

// Delete a message (authenticated)
router.delete('/messages/:messageId', authMiddleware, deleteMessage);

// Add/remove reaction (authenticated)
router.post('/messages/:messageId/reactions', authMiddleware, addReaction);

module.exports = router;
