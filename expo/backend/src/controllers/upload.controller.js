/**
 * Upload Controller
 * Handles file uploads to Cloudinary
 */

const { uploadImage, uploadVideo, uploadDocument, deleteAsset } = require('../config/cloudinary');

/**
 * Upload profile picture
 * POST /api/upload/profile-picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Check file size (max 10MB for images)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image too large (max 10MB)',
      });
    }

    // Check file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only images allowed',
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, {
      folder: 'nox-app/users/profiles',
      publicId: `user-${req.user.id}-${Date.now()}`,
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      ],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
    });
  }
};

/**
 * Upload highlight video (15 seconds max)
 * POST /api/upload/highlight
 */
const uploadHighlight = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Check file size (max 50MB for videos)
    if (req.file.size > 50 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Video too large (max 50MB)',
      });
    }

    // Check file type
    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only videos allowed',
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Upload to Cloudinary
    const result = await uploadVideo(req.file.buffer, {
      folder: `nox-app/highlights/${year}/${month}`,
      publicId: `highlight-${Date.now()}-${req.user.id}`,
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnail: result.eager && result.eager[1] ? result.eager[1].secure_url : null,
        duration: result.duration,
        format: result.format,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error('Highlight upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
    });
  }
};

/**
 * Upload memory photo
 * POST /api/upload/memory
 */
const uploadMemoryPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Check file size (max 15MB)
    if (req.file.size > 15 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image too large (max 15MB)',
      });
    }

    // Check file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only images allowed',
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, {
      folder: 'nox-app/memories/photos',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit', quality: 'auto' },
      ],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Memory photo upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
    });
  }
};

/**
 * Upload venue photo (for venue owners/admins)
 * POST /api/upload/venue
 */
const uploadVenuePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { venueId } = req.body;

    if (!venueId) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID required',
      });
    }

    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image too large (max 10MB)',
      });
    }

    // Check file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only images allowed',
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, {
      folder: 'nox-app/venues/photos',
      publicId: `venue-${venueId}-${Date.now()}`,
      transformation: [
        { width: 1920, height: 1080, crop: 'fill' },
      ],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('Venue photo upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
    });
  }
};

/**
 * Upload business verification document
 * POST /api/upload/business-document
 */
const uploadBusinessDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { documentType, notes } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type required',
        message: 'Please specify the document type',
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

    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File too large (max 10MB)',
      });
    }

    // Determine resource type based on mime type
    let resourceType = 'image';
    if (req.file.mimetype === 'application/pdf') {
      resourceType = 'raw';
    }

    // Upload to Cloudinary
    const uploadFunction = resourceType === 'image' ? uploadImage : uploadDocument;
    const result = await uploadFunction(req.file.buffer, {
      folder: 'nox-app/documents/verification',
      publicId: `doc-${req.user.id}-${documentType}-${Date.now()}`,
    });

    // Now save to business profile using the business controller
    const BusinessProfile = require('../models/BusinessProfile');
    const businessProfile = await BusinessProfile.findOne({ userId: req.user.id });

    if (!businessProfile) {
      // Delete uploaded file if no business profile found
      await deleteAsset(result.public_id, resourceType);

      return res.status(404).json({
        success: false,
        error: 'Business profile not found',
        message: 'Please create a business profile first',
      });
    }

    // Add document to profile
    const newDocument = {
      type: documentType,
      documentUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      status: 'PENDING',
      notes: notes || '',
    };

    businessProfile.documents.push(newDocument);
    businessProfile.documentsSubmitted = true;
    await businessProfile.save();

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        documentType,
        document: newDocument,
      },
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Business document upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
    });
  }
};

/**
 * Delete asset
 * DELETE /api/upload/:publicId
 */
const deleteUpload = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query; // 'image' or 'video'

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID required',
      });
    }

    // Delete from Cloudinary
    const result = await deleteAsset(publicId, resourceType || 'image');

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Delete failed',
      message: error.message,
    });
  }
};

module.exports = {
  uploadProfilePicture,
  uploadHighlight,
  uploadMemoryPhoto,
  uploadVenuePhoto,
  uploadBusinessDocument,
  deleteUpload,
};
