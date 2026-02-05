const { saveBase64Image, validateImageFile } = require('../utils/fileUpload');

/**
 * Upload image from base64
 * POST /api/upload-image
 */
exports.uploadImage = async (req, res) => {
  try {
    const { file, altText } = req.body;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }

    // Allow alt text to be optional — provide a sensible default when missing
    const altTextValue = altText && altText.trim() ? altText.trim() : 'Product image';

    // Validate file (basic check since it's base64)
    if (typeof file !== 'string' || !file.startsWith('data:image/')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid image format'
      });
    }

    // Extract MIME type and data
    const matches = file.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid base64 image format'
      });
    }

    const [, mimeType, base64Data] = matches;
    const fileSize = Buffer.byteLength(base64Data, 'base64');

    // Validate image
    validateImageFile(Buffer.from(base64Data, 'base64'), mimeType, fileSize);

    // Generate filename from mime type
    const ext = mimeType.split('/')[1].split('+')[0];
    const fileName = `image.${ext}`;

    // Save image
    const imageUrl = saveBase64Image(file, fileName);

    return res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        altText: altTextValue
      },
      imageUrl // For compatibility
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to upload image'
    });
  }
};

/**
 * Multer file upload handler (alternative approach with express middleware)
 * POST /api/upload-file
 */
exports.uploadImageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }

    const { altText } = req.body;

    // Allow alt text to be optional for file upload as well
    const altTextValue = altText && altText.trim() ? altText.trim() : 'Product image';

    // Validate file
    validateImageFile(req.file.buffer, req.file.mimetype, req.file.size);

    // Save file
    const fs = require('fs');
    const path = require('path');
    const timestamp = Date.now();
    const fileName = `${timestamp}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const uploadsDir = path.join(__dirname, '../../uploads/images');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const imageUrl = `/uploads/images/${fileName}`;

    return res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        altText: altTextValue
      },
      imageUrl // For compatibility
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to upload image'
    });
  }
};
