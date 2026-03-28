/**
 * Rork Nightlife Backend Server
 * Express.js API server for contact and Instagram sync
 */

require('dotenv').config();

// IMPORTANT: Sentry must be initialized FIRST, before any other imports
const {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler
} = require('./config/sentry');

// Initialize Sentry error tracking
initSentry();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const { initializeSocket } = require('./config/socket');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'APP_URL'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
  console.error('\nPlease set these variables in your .env file before starting the server.');
  process.exit(1);
}

// Warn about optional but recommended variables
const recommendedEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missingRecommended = recommendedEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingRecommended.length > 0) {
  console.warn(
    '⚠️  Missing recommended environment variables (emails will be logged to console):'
  );
  missingRecommended.forEach((envVar) => console.warn(`   - ${envVar}`));
}

// Database
const connectDB = require('./config/database');

// Routes
const socialRoutes = require('./routes/social.routes');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const venuesRoutes = require('./routes/venues.routes');
const growthRoutes = require('./routes/growth.routes');
const eventsRoutes = require('./routes/events.routes');
const contentRoutes = require('./routes/content.routes');
const pricingRoutes = require('./routes/pricing.routes');
const retentionRoutes = require('./routes/retention.routes');
const uploadRoutes = require('./routes/upload.routes');
const businessRoutes = require('./routes/business.routes');
const venueManagementRoutes = require('./routes/venue.routes');
const adminRoutes = require('./routes/admin.routes');
const posRoutes = require('./routes/pos.routes');
const moderationRoutes = require('./routes/moderation.routes');
const chatRoutes = require('./routes/chat.routes');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Sentry request handler - MUST be first middleware
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing with size limits
// Upload routes can accept larger payloads
app.use('/api/upload', express.json({ limit: '50mb' }));
app.use('/api/upload', express.urlencoded({ extended: true, limit: '50mb' }));

// All other routes limited to 1MB
app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parsing
app.use(cookieParser());

// NoSQL injection prevention - sanitize user input
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      key,
      path: req.path,
    });
  },
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api', limiter);

// CSRF protection - generate tokens for safe requests
const { csrfTokenGenerator, getCsrfToken } = require('./middleware/csrf.middleware');
app.use(csrfTokenGenerator);

// CSRF token endpoint (for clients that need explicit token retrieval)
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      email: 'unknown',
    },
  };

  // Check MongoDB connection
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.database = 'connected';
    } else {
      health.checks.database = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
  }

  // Check SMTP configuration
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    health.checks.email = 'configured';
  } else {
    health.checks.email = 'dev-mode';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
// Note: users and venues use /v1 prefix for legacy compatibility
// (route definitions include /users and /venues paths)
app.use('/api/v1', usersRoutes);
app.use('/api/v1', venuesRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/auth', authRoutes);

// Admin routes (requires authentication + admin role)
app.use('/api/admin', adminRoutes);

// Business profile and venue management routes
app.use('/api/business', businessRoutes);
app.use('/api/venues', venueManagementRoutes);

// POS integration routes (Toast + Square)
app.use('/api/pos', posRoutes);

// Content moderation routes (reports, blocking)
app.use('/api/moderation', moderationRoutes);

// Chat routes (REST API + Socket.io for real-time)
app.use('/api/chat', chatRoutes);

// Growth feature routes
app.use('/api/growth', growthRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/retention', retentionRoutes);

// Upload routes (Cloudinary)
app.use('/api/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Rork Nightlife API',
    version: '2.0.0',
    description: 'Backend API with complete growth features: events, ticketing, social, content, and retention',
    versioning: 'Legacy routes use /v1 prefix, newer features are unversioned',
    endpoints: {
      health: '/health',
      users: '/api/v1/users',
      venues: '/api/v1/venues',
      social: '/api/social',
      auth: '/api/auth',
      business: '/api/business',
      venueManagement: '/api/venues',
      pos: '/api/pos',
      moderation: '/api/moderation',
      chat: '/api/chat',
      growth: '/api/growth',
      events: '/api/events',
      content: '/api/content',
      pricing: '/api/pricing',
      retention: '/api/retention',
      upload: '/api/upload',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Sentry error handler - MUST be before other error handlers
app.use(sentryErrorHandler());

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Create HTTP server and initialize Socket.io
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = initializeSocket(httpServer);

// Make io available to routes if needed
app.set('io', io);

// Start server
const server = httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Rork Nightlife API Server v2.0                       ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV?.padEnd(10)}                       ║
║   Port:        ${PORT.toString().padEnd(10)}                       ║
║   Database:    MongoDB Connected                          ║
║                                                            ║
║   ✅ Core Features:                                       ║
║   - Authentication & Users    /api/v1/users               ║
║   - Venues & Vibe Checks      /api/v1/venues              ║
║   - Social & Sync             /api/social                 ║
║   - File Uploads              /api/upload                 ║
║   - Real-time Chat            Socket.io + /api/chat       ║
║                                                            ║
║   🎉 Growth Features:                                     ║
║   - Group Purchases           /api/growth                 ║
║   - Referrals & Sharing       /api/growth                 ║
║   - Events & Ticketing        /api/events                 ║
║   - Crews & Challenges        /api/social                 ║
║   - Performers & Content      /api/content                ║
║   - Dynamic Pricing           /api/pricing                ║
║   - Streaks & Memories        /api/retention              ║
║                                                            ║
║   Health Check: http://localhost:${PORT}/health               ║
║   Full API:     http://localhost:${PORT}/                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
