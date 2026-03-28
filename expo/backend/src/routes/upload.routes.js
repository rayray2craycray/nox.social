/**
 * Upload Routes
 * File upload endpoints using Cloudinary
 */

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middleware/auth.middleware');
const {
  uploadProfilePicture,
  uploadHighlight,
  uploadMemoryPhoto,
  uploadVenuePhoto,
  uploadBusinessDocument,
  deleteUpload,
} = require('../controllers/upload.controller');

const router = express.Router();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed'));
    }
  },
});

// Configure multer for document uploads (PDFs, images)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept PDFs and images
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed'));
    }
  },
});

// Rate limiter for uploads (10 per 15 minutes)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply auth and rate limiting to all upload routes
router.use(authMiddleware);
router.use(uploadLimiter);

// Upload profile picture
// POST /api/upload/profile-picture
router.post('/profile-picture', upload.single('image'), uploadProfilePicture);

// Upload highlight video
// POST /api/upload/highlight
router.post('/highlight', upload.single('video'), uploadHighlight);

// Upload memory photo
// POST /api/upload/memory
router.post('/memory', upload.single('image'), uploadMemoryPhoto);

// Upload venue photo (for venue owners)
// POST /api/upload/venue
router.post('/venue', upload.single('image'), uploadVenuePhoto);

// Upload business verification document (for business owners)
// POST /api/upload/business-document
router.post('/business-document', documentUpload.single('document'), uploadBusinessDocument);

// Delete asset
// DELETE /api/upload/:publicId
router.delete('/:publicId', deleteUpload);

// Error handler for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 50MB',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message,
    });
  }

  next();
});

module.exports = router;
