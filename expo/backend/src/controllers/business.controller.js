/**
 * Business Profile Controller
 * Handles business registration, email verification, and profile management
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const BusinessProfile = require('../models/BusinessProfile');
const VenueRole = require('../models/VenueRole');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const Venue = require('../models/Venue');
const { sendVerificationEmail } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Register a new business profile
 * POST /api/business/register
 */
exports.registerBusiness = async (req, res) => {
  try {
    const {
      venueName,
      businessEmail,
      location,
      phone,
      website,
      businessType,
      description,
    } = req.body;

    // CRITICAL: Validate authentication
    console.log('🔍 Business registration - req.user:', req.user);
    if (!req.user || !req.user.id) {
      logger.warn('Unauthenticated business registration attempt', { user: req.user });
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userId = req.user.id;
    console.log('✅ Business registration - userId:', userId);

    logger.info('Business registration attempt', {
      userId: userId.toString(),
      businessEmail,
      venueName,
    });

    // Validate required fields
    if (!venueName || !businessEmail || !location || !businessType) {
      logger.warn('Business registration failed: missing fields', { userId: userId.toString() });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Validate email format
    if (!validator.isEmail(businessEmail)) {
      logger.warn('Business registration failed: invalid email', {
        userId: userId.toString(),
        businessEmail,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format',
      });
    }

    // Validate and sanitize venue name
    if (!venueName.trim() || venueName.trim().length < 2 || venueName.length > 100) {
      logger.warn('Business registration failed: invalid venue name', {
        userId: userId.toString(),
      });
      return res.status(400).json({
        success: false,
        error: 'Venue name must be between 2 and 100 characters',
      });
    }

    // Validate website URL if provided
    if (website && !validator.isURL(website, { require_protocol: true })) {
      logger.warn('Business registration failed: invalid website URL', {
        userId: userId.toString(),
        website,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid website URL format. Must include http:// or https://',
      });
    }

    // Sanitize inputs to prevent XSS
    const sanitizedVenueName = validator.escape(venueName.trim());
    const sanitizedDescription = description ? validator.escape(description.trim()) : '';

    // Check if user already has a business profile
    const existingProfile = await BusinessProfile.findOne({ userId });
    if (existingProfile) {
      logger.warn('Business registration failed: user already has profile', {
        userId: userId.toString(),
        existingProfileId: existingProfile._id.toString(),
      });
      return res.status(400).json({
        success: false,
        error: 'You already have a business profile. Please contact support if you need to register multiple venues.',
      });
    }

    // Check if business email already registered
    const existingEmail = await BusinessProfile.findOne({
      businessEmail: businessEmail.toLowerCase(),
    });
    if (existingEmail) {
      logger.warn('Business registration failed: email already registered', {
        userId: userId.toString(),
        businessEmail,
      });
      return res.status(400).json({
        success: false,
        error: 'This business email is already registered. Please use a different email or contact support.',
      });
    }

    // Create business profile
    const businessProfile = await BusinessProfile.create({
      userId,
      venueName: sanitizedVenueName,
      businessEmail: businessEmail.toLowerCase(),
      location,
      phone,
      website,
      description: sanitizedDescription,
      businessType,
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      documentsSubmitted: false,
      documentsApproved: false,
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.create({
      businessProfileId: businessProfile._id,
      email: businessEmail.toLowerCase(),
      token,
      expiresAt,
    });

    // Send verification email
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:19006'}/business/verify-email?token=${token}`;

    try {
      await sendVerificationEmail(businessEmail, sanitizedVenueName, verificationUrl);
      logger.info('Verification email sent successfully', {
        businessProfileId: businessProfile._id.toString(),
        businessEmail,
      });
    } catch (emailError) {
      logger.error('Email send error during registration', {
        businessProfileId: businessProfile._id.toString(),
        error: emailError.message,
        stack: emailError.stack,
      });
      // Continue even if email fails - user can resend
    }

    logger.info('Business registration successful', {
      businessProfileId: businessProfile._id.toString(),
      userId: userId.toString(),
      businessEmail,
      venueName: sanitizedVenueName,
    });

    res.status(201).json({
      success: true,
      data: {
        businessProfile: {
          id: businessProfile._id,
          venueName: businessProfile.venueName,
          businessEmail: businessProfile.businessEmail,
          status: businessProfile.status,
          emailVerified: businessProfile.emailVerified,
        },
      },
      message: `Verification email sent to ${businessEmail}`,
    });
  } catch (error) {
    logger.error('Business registration error', {
      userId: req.user?._id?.toString(),
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred during registration. Please try again later.',
    });
  }
};

/**
 * Verify business email
 * GET /api/business/verify-email/:token
 */
exports.verifyEmail = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.params;

    logger.info('Email verification attempt', { token: token.substring(0, 8) + '...' });

    // Find verification token
    const verificationToken = await EmailVerificationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (!verificationToken) {
      await session.abortTransaction();
      logger.warn('Email verification failed: invalid or expired token');
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token. Please request a new verification email.',
      });
    }

    // Check if already verified
    if (verificationToken.verifiedAt) {
      await session.abortTransaction();
      logger.warn('Email verification failed: token already used');
      return res.status(400).json({
        success: false,
        error: 'This verification link has already been used.',
      });
    }

    // Get business profile
    const businessProfile = await BusinessProfile.findById(
      verificationToken.businessProfileId
    ).session(session);

    if (!businessProfile) {
      await session.abortTransaction();
      logger.error('Email verification failed: business profile not found', {
        businessProfileId: verificationToken.businessProfileId,
      });
      return res.status(404).json({
        success: false,
        error: 'Business profile not found.',
      });
    }

    // Mark token as verified
    verificationToken.verifiedAt = new Date();
    await verificationToken.save({ session });

    // Mark email as verified
    businessProfile.emailVerified = true;
    businessProfile.emailVerifiedAt = new Date();
    businessProfile.status = 'VERIFIED';
    await businessProfile.save({ session });

    // Create or find venue
    let venue = null;
    if (businessProfile.venueId) {
      venue = await Venue.findById(businessProfile.venueId).session(session);
    }

    if (!venue) {
      // Create new venue from business profile
      const venueData = {
        name: businessProfile.venueName,
        type: businessProfile.businessType === 'OTHER' ? 'BAR' : businessProfile.businessType,
        location: {
          latitude: businessProfile.location.coordinates?.coordinates[1] || 0,
          longitude: businessProfile.location.coordinates?.coordinates[0] || 0,
          address: businessProfile.location.address,
          city: businessProfile.location.city,
          state: businessProfile.location.state,
          country: businessProfile.location.country || 'USA',
        },
        imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2',
        status: 'ACTIVE',
        businessProfileId: businessProfile._id,
        description: businessProfile.description || '',
        phone: businessProfile.phone || '',
        website: businessProfile.website || '',
      };

      const [createdVenue] = await Venue.create([venueData], { session });
      venue = createdVenue;

      // Link venue to business profile
      businessProfile.venueId = venue._id;
      await businessProfile.save({ session });
    }

    // Check if HEAD_MODERATOR role already exists
    const existingRole = await VenueRole.findOne({
      venueId: venue._id,
      userId: businessProfile.userId,
    }).session(session);

    let venueRole;
    if (existingRole) {
      // Update existing role
      existingRole.role = 'HEAD_MODERATOR';
      existingRole.permissions = ['FULL_ACCESS'];
      existingRole.isActive = true;
      venueRole = await existingRole.save({ session });
    } else {
      // Create HEAD_MODERATOR role
      const [createdRole] = await VenueRole.create(
        [
          {
            venueId: venue._id,
            userId: businessProfile.userId,
            role: 'HEAD_MODERATOR',
            permissions: ['FULL_ACCESS'],
            assignedBy: businessProfile.userId,
            assignedAt: new Date(),
            isActive: true,
          },
        ],
        { session }
      );
      venueRole = createdRole;
    }

    // Commit transaction
    await session.commitTransaction();

    logger.info('Email verification successful', {
      businessProfileId: businessProfile._id.toString(),
      userId: businessProfile.userId.toString(),
      venueId: venue._id.toString(),
    });

    res.json({
      success: true,
      data: {
        businessProfile: {
          id: businessProfile._id,
          emailVerified: businessProfile.emailVerified,
          emailVerifiedAt: businessProfile.emailVerifiedAt,
          status: businessProfile.status,
          venueId: venue._id,
        },
        venue: {
          id: venue._id,
          name: venue.name,
          type: venue.type,
        },
        venueRole: {
          id: venueRole._id,
          role: venueRole.role,
          permissions: venueRole.permissions,
        },
      },
      message: 'Email verified successfully! You are now the HEAD_MODERATOR of your venue.',
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();

    logger.error('Email verification error', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'An error occurred during verification. Please try again later.',
    });
  } finally {
    session.endSession();
  }
};

/**
 * Resend verification email
 * POST /api/business/resend-verification
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get business profile
    const businessProfile = await BusinessProfile.findOne({ userId });

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    if (businessProfile.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
      });
    }

    // Delete old tokens
    await EmailVerificationToken.deleteMany({
      businessProfileId: businessProfile._id,
    });

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerificationToken.create({
      businessProfileId: businessProfile._id,
      email: businessProfile.businessEmail,
      token,
      expiresAt,
    });

    // Send verification email
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:19000'}/verify-email/${token}`;
    await sendVerificationEmail(
      businessProfile.businessEmail,
      businessProfile.venueName,
      verificationUrl
    );

    res.json({
      success: true,
      message: 'Verification email resent',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get user's business profile
 * GET /api/business/profile
 */
exports.getBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const businessProfile = await BusinessProfile.findOne({ userId }).populate(
      'venueId',
      'name type location.city location.state'
    );

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    res.json({
      success: true,
      data: {
        businessProfile,
      },
    });
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Update business profile
 * PATCH /api/business/profile
 */
exports.updateBusinessProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = ['phone', 'website', 'description'];
    const updateFields = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    });

    const businessProfile = await BusinessProfile.findOneAndUpdate(
      { userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    res.json({
      success: true,
      data: {
        businessProfile,
      },
      message: 'Business profile updated successfully',
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Upload verification document
 * POST /api/business/documents/upload
 */
exports.uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, documentUrl, fileName, fileSize, notes } = req.body;

    logger.info('Document upload attempt', {
      userId,
      documentType,
      fileName,
    });

    // Validate required fields
    if (!documentType || !documentUrl || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'documentType, documentUrl, and fileName are required',
      });
    }

    // Validate document type
    const validTypes = ['BUSINESS_LICENSE', 'TAX_ID', 'PHOTO_ID', 'PROOF_OF_ADDRESS', 'OTHER'];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type',
        message: `Document type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Get business profile
    const businessProfile = await BusinessProfile.findOne({ userId });

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    // Add document
    const newDocument = {
      type: documentType,
      documentUrl,
      fileName,
      fileSize: fileSize || null,
      uploadedAt: new Date(),
      status: 'PENDING',
      notes: notes || '',
    };

    businessProfile.documents.push(newDocument);
    businessProfile.documentsSubmitted = true;
    await businessProfile.save();

    logger.info('Document uploaded successfully', {
      userId,
      businessProfileId: businessProfile._id.toString(),
      documentType,
    });

    res.status(201).json({
      success: true,
      data: {
        document: newDocument,
        totalDocuments: businessProfile.documents.length,
      },
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    logger.error('Document upload error', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred during document upload',
    });
  }
};

/**
 * Get all documents for business profile
 * GET /api/business/documents
 */
exports.getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const businessProfile = await BusinessProfile.findOne({ userId }).select('documents');

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    res.json({
      success: true,
      data: {
        documents: businessProfile.documents,
        totalDocuments: businessProfile.documents.length,
        pendingCount: businessProfile.documents.filter((d) => d.status === 'PENDING').length,
        approvedCount: businessProfile.documents.filter((d) => d.status === 'APPROVED').length,
        rejectedCount: businessProfile.documents.filter((d) => d.status === 'REJECTED').length,
      },
    });
  } catch (error) {
    logger.error('Get documents error', {
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching documents',
    });
  }
};

/**
 * Delete a document
 * DELETE /api/business/documents/:documentId
 */
exports.deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const businessProfile = await BusinessProfile.findOne({ userId });

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    // Find document
    const documentIndex = businessProfile.documents.findIndex(
      (doc) => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Only allow deleting documents that are pending or rejected
    const document = businessProfile.documents[documentIndex];
    if (document.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete approved documents',
      });
    }

    // Remove document
    businessProfile.documents.splice(documentIndex, 1);

    // Update documentsSubmitted flag if no documents left
    if (businessProfile.documents.length === 0) {
      businessProfile.documentsSubmitted = false;
    }

    await businessProfile.save();

    logger.info('Document deleted', {
      userId,
      documentId,
      documentType: document.type,
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    logger.error('Delete document error', {
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting document',
    });
  }
};
