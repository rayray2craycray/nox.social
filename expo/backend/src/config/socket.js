const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message.model');

/**
 * Initialize Socket.io server for real-time chat
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userName = decoded.email.split('@')[0]; // TODO: Get from user profile

      console.log(`[Socket] User authenticated: ${socket.userName} (${socket.userId})`);
      next();
    } catch (error) {
      console.error('[Socket] Auth error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.userName})`);

    // Join a channel
    socket.on('join:channel', async (channelId) => {
      try {
        socket.join(channelId);
        console.log(`[Socket] User ${socket.userName} joined channel: ${channelId}`);

        // Notify other users in the channel
        socket.to(channelId).emit('user:joined', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date().toISOString(),
        });

        // Send confirmation to the user
        socket.emit('channel:joined', {
          channelId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Socket] Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Leave a channel
    socket.on('leave:channel', (channelId) => {
      socket.leave(channelId);
      console.log(`[Socket] User ${socket.userName} left channel: ${channelId}`);

      // Notify other users
      socket.to(channelId).emit('user:left', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString(),
      });
    });

    // Send a message
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, replyTo } = data;

        if (!content || content.trim().length === 0) {
          return socket.emit('error', { message: 'Message content is required' });
        }

        if (content.length > 2000) {
          return socket.emit('error', { message: 'Message too long (max 2000 characters)' });
        }

        // Get user badge (TODO: Fetch from user profile)
        const userBadge = 'GUEST';

        // Save message to database
        const message = await Message.create({
          channelId,
          userId: socket.userId,
          userName: socket.userName,
          userBadge,
          content: content.trim(),
          replyTo,
          timestamp: new Date(),
        });

        // Broadcast message to all users in the channel (including sender)
        io.to(channelId).emit('message:new', {
          id: message._id.toString(),
          channelId: message.channelId,
          userId: message.userId,
          userName: message.userName,
          userBadge: message.userBadge,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          replyTo: message.replyTo,
          reactions: message.reactions,
          edited: false,
          deleted: false,
          isOwn: false, // Will be set to true on client side
        });

        console.log(`[Socket] Message sent in ${channelId} by ${socket.userName}`);
      } catch (error) {
        console.error('[Socket] Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Edit a message
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await Message.findById(messageId);

        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        if (message.userId !== socket.userId) {
          return socket.emit('error', { message: 'You can only edit your own messages' });
        }

        message.content = content.trim();
        message.edited = true;
        await message.save();

        // Broadcast edit to all users in the channel
        io.to(message.channelId).emit('message:edited', {
          messageId: message._id.toString(),
          content: message.content,
          edited: true,
          timestamp: message.timestamp.toISOString(),
        });

        console.log(`[Socket] Message ${messageId} edited by ${socket.userName}`);
      } catch (error) {
        console.error('[Socket] Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete a message
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);

        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        if (message.userId !== socket.userId) {
          return socket.emit('error', { message: 'You can only delete your own messages' });
        }

        message.deleted = true;
        message.content = '[Message deleted]';
        await message.save();

        // Broadcast deletion to all users in the channel
        io.to(message.channelId).emit('message:deleted', {
          messageId: message._id.toString(),
          timestamp: new Date().toISOString(),
        });

        console.log(`[Socket] Message ${messageId} deleted by ${socket.userName}`);
      } catch (error) {
        console.error('[Socket] Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { channelId } = data;
      socket.to(channelId).emit('user:typing', {
        userId: socket.userId,
        userName: socket.userName,
        channelId,
      });
    });

    socket.on('typing:stop', (data) => {
      const { channelId } = data;
      socket.to(channelId).emit('user:stopped-typing', {
        userId: socket.userId,
        channelId,
      });
    });

    // Add reaction
    socket.on('reaction:add', async (data) => {
      try {
        const { messageId, emoji } = data;

        const message = await Message.findById(messageId);

        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        // Find or create reaction
        const existingReaction = message.reactions.find((r) => r.emoji === emoji);

        if (existingReaction) {
          // Toggle reaction
          if (existingReaction.userIds.includes(socket.userId)) {
            existingReaction.userIds = existingReaction.userIds.filter(
              (id) => id !== socket.userId
            );
          } else {
            existingReaction.userIds.push(socket.userId);
          }
        } else {
          message.reactions.push({
            emoji,
            userIds: [socket.userId],
          });
        }

        await message.save();

        // Broadcast reaction to all users in the channel
        io.to(message.channelId).emit('reaction:updated', {
          messageId: message._id.toString(),
          reactions: message.reactions,
          timestamp: new Date().toISOString(),
        });

        console.log(`[Socket] Reaction ${emoji} added to message ${messageId} by ${socket.userName}`);
      } catch (error) {
        console.error('[Socket] Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id} (User: ${socket.userName})`);
    });
  });

  console.log('[Socket] Socket.io server initialized');
  return io;
}

module.exports = { initializeSocket };
