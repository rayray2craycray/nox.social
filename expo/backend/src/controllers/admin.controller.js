/**
 * Admin Controller
 * Handles business profile review and approval
 */

const BusinessProfile = require('../models/BusinessProfile');
const User = require('../models/User');
const Venue = require('../models/Venue');
const VenueRole = require('../models/VenueRole');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all business profiles with filters
 * GET /api/admin/business-profiles
 */
exports.getBusinessProfiles = async (req, res) => {
  try {
    const {
      status,
      emailVerified,
      documentsSubmitted,
      documentsApproved,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter query
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (emailVerified !== undefined) {
      filter.emailVerified = emailVerified === 'true';
    }

    if (documentsSubmitted !== undefined) {
      filter.documentsSubmitted = documentsSubmitted === 'true';
    }

    if (documentsApproved !== undefined) {
      filter.documentsApproved = documentsApproved === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get business profiles
    const businessProfiles = await BusinessProfile.find(filter)
      .populate('userId', 'displayName email createdAt')
      .populate('venueId', 'name type location.city location.state')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await BusinessProfile.countDocuments(filter);

    // Get statistics
    const stats = {
      total: totalCount,
      pending: await BusinessProfile.countDocuments({ status: 'PENDING_VERIFICATION' }),
      verified: await BusinessProfile.countDocuments({ status: 'VERIFIED' }),
      rejected: await BusinessProfile.countDocuments({ status: 'REJECTED' }),
      suspended: await BusinessProfile.countDocuments({ status: 'SUSPENDED' }),
      emailVerified: await BusinessProfile.countDocuments({ emailVerified: true }),
      documentsSubmitted: await BusinessProfile.countDocuments({ documentsSubmitted: true }),
      documentsApproved: await BusinessProfile.countDocuments({ documentsApproved: true }),
    };

    logger.info('Business profiles retrieved by admin', {
      adminId: req.admin.id,
      count: businessProfiles.length,
      filter,
    });

    res.json({
      success: true,
      data: {
        businessProfiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
        },
        stats,
      },
    });
  } catch (error) {
    logger.error('Get business profiles error', {
      adminId: req.admin?.id,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve business profiles',
    });
  }
};

/**
 * Get business profile details
 * GET /api/admin/business-profiles/:id
 */
exports.getBusinessProfileDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const businessProfile = await BusinessProfile.findById(id)
      .populate('userId', 'displayName email phone createdAt lastLoginAt')
      .populate('venueId');

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    logger.info('Business profile details retrieved', {
      adminId: req.admin.id,
      businessProfileId: id,
    });

    res.json({
      success: true,
      data: {
        businessProfile,
      },
    });
  } catch (error) {
    logger.error('Get business profile details error', {
      adminId: req.admin?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve business profile',
    });
  }
};

/**
 * Approve or reject business profile
 * PUT /api/admin/business-profiles/:id/review
 */
exports.reviewBusinessProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    // Validate action
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be either APPROVE or REJECT',
      });
    }

    // Get business profile
    const businessProfile = await BusinessProfile.findById(id)
      .populate('userId');

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    // Check if email is verified
    if (!businessProfile.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email not verified',
        message: 'Business must verify their email before approval',
      });
    }

    // Check if documents are submitted
    if (!businessProfile.documentsSubmitted || businessProfile.documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No documents submitted',
        message: 'Business must submit verification documents before approval',
      });
    }

    if (action === 'APPROVE') {
      // Mark all documents as approved
      businessProfile.documents.forEach((doc) => {
        if (doc.status === 'PENDING') {
          doc.status = 'APPROVED';
          doc.reviewedBy = req.admin.id;
          doc.reviewedAt = new Date();
        }
      });

      businessProfile.documentsApproved = true;
      businessProfile.status = 'VERIFIED';

      // Create venue if not exists
      if (!businessProfile.venueId) {
        const longitude = businessProfile.location.coordinates?.coordinates?.[0] || 0;
        const latitude = businessProfile.location.coordinates?.coordinates?.[1] || 0;

        const venueData = {
          name: businessProfile.venueName,
          type: businessProfile.businessType === 'OTHER' ? 'BAR' : businessProfile.businessType,
          location: {
            latitude,
            longitude,
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

        // Don't set coordinates if they're 0,0 (missing)
        if (latitude !== 0 || longitude !== 0) {
          venueData.location.coordinates = {
            type: 'Point',
            coordinates: [longitude, latitude],
          };
        }

        const venue = await Venue.create(venueData);
        businessProfile.venueId = venue._id;

        // Create HEAD_MODERATOR role
        await VenueRole.create({
          venueId: venue._id,
          userId: businessProfile.userId,
          role: 'HEAD_MODERATOR',
          permissions: ['FULL_ACCESS'],
          assignedBy: businessProfile.userId,
          assignedAt: new Date(),
          isActive: true,
        });
      }

      await businessProfile.save();

      logger.info('Business profile approved', {
        adminId: req.admin.id,
        businessProfileId: id,
        venueName: businessProfile.venueName,
      });

      res.json({
        success: true,
        data: {
          businessProfile,
        },
        message: 'Business profile approved successfully',
      });
    } else {
      // REJECT
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason required',
          message: 'Please provide a detailed reason for rejection (minimum 10 characters)',
        });
      }

      businessProfile.status = 'REJECTED';
      businessProfile.rejectionReason = rejectionReason;
      businessProfile.documentsApproved = false;

      await businessProfile.save();

      logger.info('Business profile rejected', {
        adminId: req.admin.id,
        businessProfileId: id,
        reason: rejectionReason,
      });

      res.json({
        success: true,
        data: {
          businessProfile,
        },
        message: 'Business profile rejected',
      });
    }
  } catch (error) {
    logger.error('Review business profile error', {
      adminId: req.admin?.id,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to review business profile',
    });
  }
};

/**
 * Approve or reject individual document
 * PUT /api/admin/business-profiles/:id/documents/:documentId/review
 */
exports.reviewDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const { action, rejectionReason, notes } = req.body;

    // Validate action
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be either APPROVE or REJECT',
      });
    }

    // Get business profile
    const businessProfile = await BusinessProfile.findById(id);

    if (!businessProfile) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
      });
    }

    // Find document
    const document = businessProfile.documents.id(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Update document
    if (action === 'APPROVE') {
      document.status = 'APPROVED';
      document.reviewedBy = req.admin.id;
      document.reviewedAt = new Date();
      document.rejectionReason = undefined;

      if (notes) {
        document.notes = notes;
      }

      await businessProfile.save();

      logger.info('Document approved', {
        adminId: req.admin.id,
        businessProfileId: id,
        documentId,
        documentType: document.type,
      });

      res.json({
        success: true,
        data: {
          document,
        },
        message: 'Document approved successfully',
      });
    } else {
      // REJECT
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason required',
          message: 'Please provide a detailed reason for rejection (minimum 10 characters)',
        });
      }

      document.status = 'REJECTED';
      document.rejectionReason = rejectionReason;
      document.reviewedBy = req.admin.id;
      document.reviewedAt = new Date();

      if (notes) {
        document.notes = notes;
      }

      await businessProfile.save();

      logger.info('Document rejected', {
        adminId: req.admin.id,
        businessProfileId: id,
        documentId,
        documentType: document.type,
        reason: rejectionReason,
      });

      res.json({
        success: true,
        data: {
          document,
        },
        message: 'Document rejected',
      });
    }
  } catch (error) {
    logger.error('Review document error', {
      adminId: req.admin?.id,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to review document',
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {
      businessProfiles: {
        total: await BusinessProfile.countDocuments(),
        pending: await BusinessProfile.countDocuments({ status: 'PENDING_VERIFICATION' }),
        verified: await BusinessProfile.countDocuments({ status: 'VERIFIED' }),
        rejected: await BusinessProfile.countDocuments({ status: 'REJECTED' }),
        suspended: await BusinessProfile.countDocuments({ status: 'SUSPENDED' }),
      },
      documents: {
        pending: await BusinessProfile.countDocuments({
          'documents.status': 'PENDING',
        }),
        approved: await BusinessProfile.countDocuments({
          'documents.status': 'APPROVED',
        }),
        rejected: await BusinessProfile.countDocuments({
          'documents.status': 'REJECTED',
        }),
      },
      users: {
        total: await User.countDocuments(),
        admins: await User.countDocuments({ role: 'ADMIN' }),
        superAdmins: await User.countDocuments({ role: 'SUPER_ADMIN' }),
      },
      venues: {
        total: await Venue.countDocuments(),
        active: await Venue.countDocuments({ status: 'ACTIVE' }),
      },
      recentApplications: await BusinessProfile.find({ status: 'PENDING_VERIFICATION' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'displayName email')
        .select('venueName businessEmail createdAt documentsSubmitted'),
    };

    logger.info('Dashboard stats retrieved', {
      adminId: req.admin.id,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get dashboard stats error', {
      adminId: req.admin?.id,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics',
    });
  }
};
