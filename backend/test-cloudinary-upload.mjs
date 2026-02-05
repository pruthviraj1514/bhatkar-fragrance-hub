#!/usr/bin/env node

/**
 * Test Cloudinary Image Upload Flow
 * Checks if images are uploading to Cloudinary and generating URLs correctly
 */

import cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const v2 = cloudinary.v2;

console.log('🔍 Cloudinary Upload Diagnostic\n');
console.log('═'.repeat(80) + '\n');

// Step 1: Verify Cloudinary Configuration
console.log('📍 Step 1: Verify Cloudinary Configuration');
console.log('─'.repeat(80));

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log(`✓ CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Configured' : '❌ MISSING'}`);
console.log(`✓ CLOUDINARY_API_KEY: ${apiKey ? '✅ Configured' : '❌ MISSING'}`);
console.log(`✓ CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Configured' : '❌ MISSING'}\n`);

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ ERROR: Cloudinary credentials not found in .env file');
  console.error('   Required environment variables:');
  console.error('   - CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET\n');
  process.exit(1);
}

// Configure Cloudinary
v2.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('✅ Cloudinary configuration loaded\n');

// Step 2: Test Account Access
console.log('📍 Step 2: Test Cloudinary Account Access');
console.log('─'.repeat(80));

async function testCloudinaryAccess() {
  try {
    // Try to get account information
    const result = await v2.api.resources({ max_results: 1 });
    console.log('✅ Successfully connected to Cloudinary API');
    console.log(`   Cloud Name: ${cloudName}`);
    console.log(`   Current resources: ${result.resources.length}\n`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Cloudinary API');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Step 3: Check for existing uploaded images
console.log('📍 Step 3: Check for Uploaded Images');
console.log('─'.repeat(80));

async function checkUploadedImages() {
  try {
    const result = await v2.api.resources({
      prefix: 'bhatkar-fragrance-hub',
      max_results: 10
    });

    if (result.resources.length > 0) {
      console.log(`✅ Found ${result.resources.length} images in Cloudinary\n`);
      
      console.log('Recent uploaded images:');
      result.resources.slice(0, 5).forEach((resource, idx) => {
        console.log(`\n   Image ${idx + 1}:`);
        console.log(`   - Public ID: ${resource.public_id}`);
        console.log(`   - URL: ${resource.secure_url}`);
        console.log(`   - Size: ${(resource.bytes / 1024).toFixed(2)} KB`);
        console.log(`   - Format: ${resource.format}`);
        console.log(`   - Uploaded: ${new Date(resource.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  No images found in bhatkar-fragrance-hub folder');
      console.log('   This is expected if no images have been uploaded yet.\n');
    }
  } catch (error) {
    console.error('❌ Failed to check uploaded images');
    console.error(`   Error: ${error.message}\n`);
  }
}

// Step 4: Test Upload with a Sample Image
console.log('📍 Step 4: Test Upload with Sample Image');
console.log('─'.repeat(80));

async function testUpload() {
  try {
    // Create a simple test image (1x1 pixel red PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    console.log('Uploading test image to Cloudinary...');
    
    const result = await new Promise((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          public_id: `bhatkar-fragrance-hub/test-${Date.now()}`,
          folder: 'bhatkar-fragrance-hub',
          tags: ['test', 'diagnostic']
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(testImageBuffer);
    });

    console.log('✅ Test image uploaded successfully!\n');
    console.log('Upload Response:');
    console.log(`   - Public ID: ${result.public_id}`);
    console.log(`   - Secure URL: ${result.secure_url}`);
    console.log(`   - Width: ${result.width}px`);
    console.log(`   - Height: ${result.height}px`);
    console.log(`   - Format: ${result.format}`);
    console.log(`   - Size: ${(result.bytes / 1024).toFixed(2)} KB\n`);

    // Verify URL is accessible
    console.log('📍 Step 5: Verify URL Accessibility');
    console.log('─'.repeat(80));
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(result.secure_url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ URL is accessible (HTTP ${response.status})\n`);
      } else {
        console.log(`⚠️  URL returned status ${response.status}\n`);
      }
    } catch (e) {
      console.log(`⚠️  Could not verify URL accessibility: ${e.message}\n`);
    }

    return result;
  } catch (error) {
    console.error('❌ Test upload failed');
    console.error(`   Error: ${error.message}\n`);
    return null;
  }
}

// Step 6: Check Database URLs Format
console.log('📍 Step 6: URL Format Validation');
console.log('─'.repeat(80));

function validateCloudinaryUrl(url) {
  const isValid = url && url.includes('res.cloudinary.com');
  const hasSecure = url && url.includes('https://');
  
  return {
    isValid,
    hasSecure,
    format: isValid && hasSecure ? '✅ Valid Cloudinary URL' : '❌ Invalid URL format'
  };
}

// Run all tests
async function runDiagnostics() {
  const canConnect = await testCloudinaryAccess();
  
  if (!canConnect) {
    console.log('\n❌ Cannot proceed - Cloudinary connection failed');
    console.log('   Check your credentials and internet connection\n');
    process.exit(1);
  }

  await checkUploadedImages();
  
  console.log('📍 Step 5: Test Upload');
  console.log('─'.repeat(80));
  const uploadResult = await testUpload();

  // Summary
  console.log('═'.repeat(80));
  console.log('\n📊 DIAGNOSTIC SUMMARY\n');

  console.log('✅ Cloudinary Configuration: Connected');
  console.log(`✅ Cloud Name: ${cloudName}`);
  console.log(`✅ Upload Folder: bhatkar-fragrance-hub`);
  console.log(`✅ Test Upload: ${uploadResult ? 'SUCCESS' : 'FAILED'}`);

  if (uploadResult) {
    const urlValidation = validateCloudinaryUrl(uploadResult.secure_url);
    console.log(`✅ URL Format: ${urlValidation.format}`);
    console.log(`✅ HTTPS Secure: ${urlValidation.hasSecure ? 'Yes' : 'No'}`);
  }

  console.log('\n📋 Next Steps:\n');
  console.log('1. If all tests passed (✅):');
  console.log('   - Images SHOULD upload successfully to Cloudinary');
  console.log('   - URLs SHOULD be generated correctly');
  console.log('   - Check browser console for any frontend errors');
  console.log('   - Verify images appear in admin dashboard\n');

  console.log('2. If any test failed (❌):');
  console.log('   - Check Cloudinary credentials in .env');
  console.log('   - Verify internet connection');
  console.log('   - Check Cloudinary account quota');
  console.log('   - Review backend logs for upload errors\n');

  console.log('3. To view uploaded images:');
  console.log(`   - Go to: https://cloudinary.com/console/c/${cloudName}`);
  console.log('   - Look in Media Library folder: bhatkar-fragrance-hub\n');

  console.log('═'.repeat(80) + '\n');
}

runDiagnostics().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
