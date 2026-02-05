const cloudinary = require('cloudinary').v2;
const { logger } = require('../utils/logger');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration on startup
const verifyCloudinaryConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    logger.error('❌ Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
    // Throwing here will stop the server on startup which helps catch misconfiguration early
    throw new Error('Cloudinary configuration incomplete');
  }
  logger.info('✅ Cloudinary configured successfully');
};

// Upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: `bhatkar-fragrance-hub/${fileName}`,
          folder: 'bhatkar-fragrance-hub'
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload error: ${error.message}`);
            reject(error);
          } else {
            logger.info(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format
            });
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    logger.error(`Upload to Cloudinary failed: ${error.message}`);
    throw error;
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`✅ Image deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Delete from Cloudinary failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  cloudinary,
  verifyCloudinaryConfig,
  uploadToCloudinary,
  deleteFromCloudinary
};
