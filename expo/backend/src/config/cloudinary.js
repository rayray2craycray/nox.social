/**
 * Cloudinary Configuration
 * Cloud-based media management for images and videos
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'nox-app',
        public_id: options.publicId,
        transformation: options.transformation,
        resource_type: 'image',
        format: options.format || 'jpg',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload video to Cloudinary
 * @param {Buffer} fileBuffer - Video file buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadVideo = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'nox-app/highlights',
        public_id: options.publicId,
        transformation: options.transformation,
        resource_type: 'video',
        format: 'mp4',
        eager: [
          { width: 720, height: 1280, crop: 'fit', quality: 'auto', video_codec: 'h264' },
          { width: 400, height: 400, crop: 'fill', gravity: 'center', format: 'jpg' },
        ],
        eager_async: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete asset from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('image' or 'video')
 * @returns {Promise<Object>} Delete result
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Upload document to Cloudinary (PDFs, images, etc.)
 * @param {Buffer} fileBuffer - Document file buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadDocument = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'nox-app/documents',
        public_id: options.publicId,
        resource_type: 'raw', // For PDFs and other non-image files
        format: options.format,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Generate transformation URL
 * @param {string} publicId - Cloudinary public ID
 * @param {Array} transformation - Transformation options
 * @param {string} resourceType - Resource type ('image' or 'video')
 * @returns {string} Transformed URL
 */
const generateTransformationUrl = (publicId, transformation, resourceType = 'image') => {
  return cloudinary.url(publicId, {
    transformation,
    resource_type: resourceType,
    secure: true,
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadDocument,
  deleteAsset,
  generateTransformationUrl,
};
