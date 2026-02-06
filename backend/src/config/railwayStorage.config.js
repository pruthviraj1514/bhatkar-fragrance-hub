#!/usr/bin/env node

/**
 * Railway Object Storage Configuration
 * S3-compatible bucket setup for product images
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const railwayS3Config = {
  endpoint: process.env.S3_ENDPOINT || 'https://t3.storageapi.dev',
  region: 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for S3-compatible services
};

// Log configuration (hide sensitive values)
console.log('🔧 Railway Storage Configuration:');
console.log(`  - Endpoint: ${railwayS3Config.endpoint}`);
console.log(`  - Bucket: ${process.env.S3_BUCKET || 'NOT SET'}`);
console.log(`  - Access Key: ${process.env.S3_ACCESS_KEY ? '✅ Set' : '❌ NOT SET'}`);
console.log(`  - Secret Key: ${process.env.S3_SECRET_KEY ? '✅ Set' : '❌ NOT SET'}`);

// Initialize S3 client
const s3Client = new S3Client(railwayS3Config);

/**
 * Upload file to Railway Object Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Original file name
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToRailway(fileBuffer, fileName) {
  try {
    // Validate credentials and config
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable not set');
    }
    if (!process.env.S3_ACCESS_KEY) {
      throw new Error('S3_ACCESS_KEY environment variable not set');
    }
    if (!process.env.S3_SECRET_KEY) {
      throw new Error('S3_SECRET_KEY environment variable not set');
    }

    // Generate unique key to prevent name collisions
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileKey = `products/${timestamp}-${random}-${fileName}`;

    // Detect MIME type from fileName
    const mimeType = detectMimeType(fileName);

    console.log(`📤 Starting upload to Railway Storage:`, {
      bucket: process.env.S3_BUCKET,
      key: fileKey,
      fileSize: fileBuffer.length,
      mimeType: mimeType,
      endpoint: process.env.S3_ENDPOINT,
    });

    // PutObjectCommand - Railway doesn't support ACL, so we don't include it
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
      // Note: Railway Object Storage doesn't support ACL parameter
      // Access is controlled via bucket policy or signed URLs
    });

    const result = await s3Client.send(uploadCommand);
    console.log(`✅ Upload successful:`, {
      key: fileKey,
      etag: result.ETag,
    });

    // Generate signed URL valid for 7 days (Railway requirement)
    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
    });

    const publicUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 }); // 7 days
    console.log(`✅ Signed URL generated (7 day expiry): ${publicUrl.substring(0, 80)}...`);
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Upload failed:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw new Error(`Failed to upload to Railway Storage: ${error.message}`);
  }
}

/**
 * Helper function to detect MIME type from filename
 * @param {string} fileName - File name
 * @returns {string} - MIME type
 */
function detectMimeType(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Delete file from Railway Object Storage
 * @param {string} fileUrl - Full URL of the file to delete
 * @returns {Promise<void>}
 */
async function deleteFromRailway(fileUrl) {
  try {
    // Extract file key from URL
    const urlParts = fileUrl.split(`${process.env.S3_BUCKET}/`);
    if (urlParts.length !== 2) {
      throw new Error('Invalid file URL format');
    }
    const fileKey = urlParts[1];

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
    });

    await s3Client.send(deleteCommand);
    console.log(`✅ Deleted: ${fileUrl}`);
  } catch (error) {
    console.error('❌ Delete error:', error.message);
    throw new Error(`Failed to delete from Railway Storage: ${error.message}`);
  }
}

/**
 * Verify connection to Railway Object Storage
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  try {
    const testKey = '.connection-test';
    const testBuffer = Buffer.from('test');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: testKey,
        Body: testBuffer,
      })
    );

    // Clean up test file
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: testKey,
      })
    );

    console.log('✅ Successfully connected to Railway Object Storage');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

module.exports = {
  uploadToRailway,
  deleteFromRailway,
  verifyConnection,
  s3Client,
};
