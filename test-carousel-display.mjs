#!/usr/bin/env node

/**
 * Test Carousel Display for Each Product
 * Simulates what customers see on product detail pages
 */

import axios from 'axios';

const BACKEND_URL = 'https://bhatkar-fragrance-hub-1.onrender.com/api';

console.log('🎠 Product Carousel Display Verification\n');
console.log('═'.repeat(80) + '\n');

async function testCarouselForAllProducts() {
  try {
    // Fetch all products with images
    const response = await axios.get(`${BACKEND_URL}/products/with-images/all`);
    const products = response.data.data;

    console.log(`📊 Testing carousel display for ${products.length} products\n`);
    console.log('─'.repeat(80) + '\n');

    let productsTested = 0;
    let productsWithImages = 0;
    let productsWithoutImages = 0;
    let totalImagesDisplayable = 0;

    // Test each product
    for (const product of products) {
      productsTested++;
      const images = product.images || [];

      if (images.length === 0) {
        productsWithoutImages++;
        console.log(`⚠️  Product ${product.id.toString().padEnd(3)} | ${product.name.padEnd(30)} | NO IMAGES`);
      } else {
        productsWithImages++;
        totalImagesDisplayable += images.length;

        // Calculate carousel display info
        const displayWidth = 3; // 3-4 images per frame
        const needsScroll = images.length > displayWidth;
        const scrollStatus = needsScroll ? '(scrollable)' : '(fits in view)';

        console.log(`✅ Product ${product.id.toString().padEnd(3)} | ${product.name.padEnd(30)} | ${images.length} images ${scrollStatus}`);

        // List each image
        images.forEach((img, idx) => {
          const isThumbnail = img.is_thumbnail ? '📌' : '  ';
          const hasUrl = img.image_url ? '✅' : '❌';
          const isCloudinary = img.image_url?.includes('cloudinary.com') ? '☁️ ' : '❌';
          
          console.log(
            `   ${isThumbnail} [${idx + 1}] ${hasUrl} ${isCloudinary} ${img.alt_text || 'No alt text'}`
          );
        });

        console.log();
      }
    }

    // Summary
    console.log('─'.repeat(80) + '\n');
    console.log('📊 CAROUSEL SUMMARY\n');
    console.log(`Total products tested: ${productsTested}`);
    console.log(`Products with images: ${productsWithImages} (${((productsWithImages/productsTested)*100).toFixed(1)}%)`);
    console.log(`Products without images: ${productsWithoutImages} (${((productsWithoutImages/productsTested)*100).toFixed(1)}%)`);
    
    if (productsWithImages > 0) {
      console.log(`Total images displayable: ${totalImagesDisplayable}`);
      console.log(`Average images per product: ${(totalImagesDisplayable/productsWithImages).toFixed(1)}`);
    }

    console.log('\n');

    // Test specific product detail page
    console.log('📍 Testing Specific Product Detail Pages\n');
    console.log('─'.repeat(80) + '\n');

    // Test a few specific products
    const testProductIds = [1, 2, 3, 4, 5];

    for (const productId of testProductIds) {
      try {
        const productResponse = await axios.get(`${BACKEND_URL}/products/${productId}/with-images`);
        const product = productResponse.data.data;

        console.log(`🔍 Product Detail Page: /product/${productId}`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Brand: ${product.brand}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   Stock: ${product.stock} units`);

        const images = product.images || [];
        console.log(`   Images: ${images.length}\n`);

        if (images.length > 0) {
          console.log('   Carousel Config:');
          console.log(`   - Will display: ✅ Yes`);
          console.log(`   - Image count: ${images.length}`);
          console.log(`   - All have URLs: ${images.every(i => i.image_url) ? '✅ Yes' : '❌ No'}`);
          console.log(`   - Are Cloudinary: ${images.every(i => i.image_url?.includes('cloudinary.com')) ? '✅ Yes' : '⚠️ Mixed'}`);
          console.log(`   - Thumbnail: ${images.find(i => i.is_thumbnail)?.alt_text || 'Not set'}`);
          console.log(`   - Scrollable: ${images.length > 4 ? '✅ Yes' : '❌ No'}`);
        } else {
          console.log('   Carousel Config:');
          console.log(`   - Will display: ❌ No (shows "No images available")`);
        }

        console.log('\n');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️  Product ${productId}: Not found\n`);
        } else {
          console.log(`❌ Product ${productId}: Error - ${error.message}\n`);
        }
      }
    }

    console.log('═'.repeat(80) + '\n');
    console.log('✅ Carousel Display Verification Complete\n');

    console.log('📝 Interpretation:\n');
    console.log('✅ = Carousel will display correctly');
    console.log('⚠️  = Some data might be incomplete');
    console.log('❌ = Carousel will NOT display\n');

    console.log('🎯 To view working carousel:\n');
    console.log('1. Go to: https://your-frontend.com/product/2');
    console.log('2. Should see carousel with product images');
    console.log('3. Can scroll left/right if more than 4 images');
    console.log('4. Click thumbnails to view main image\n');

    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCarouselForAllProducts();
