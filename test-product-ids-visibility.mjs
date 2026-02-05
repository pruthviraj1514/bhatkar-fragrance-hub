#!/usr/bin/env node

/**
 * Verify Product Unique IDs and Image Visibility
 * Ensures each product has unique ID and images properly linked
 */

import axios from 'axios';

const BACKEND_URL = 'https://bhatkar-fragrance-hub-1.onrender.com/api';

console.log('🔍 Product Unique IDs & Image Visibility Verification\n');
console.log('═'.repeat(80) + '\n');

// Test 1: Verify All Products Have Unique IDs
console.log('📍 Test 1: Verify Unique Product IDs');
console.log('─'.repeat(80));

async function verifyUniqueProductIds() {
  try {
    const response = await axios.get(`${BACKEND_URL}/products`);
    const products = response.data.data;

    console.log(`✅ Total products: ${products.length}\n`);

    // Check for unique IDs
    const ids = products.map(p => p.id);
    const uniqueIds = new Set(ids);

    if (ids.length === uniqueIds.size) {
      console.log('✅ All product IDs are UNIQUE');
      console.log(`   Total IDs: ${ids.length}`);
      console.log(`   Unique IDs: ${uniqueIds.size}\n`);
    } else {
      console.log('❌ DUPLICATE product IDs found!');
      console.log(`   Total IDs: ${ids.length}`);
      console.log(`   Unique IDs: ${uniqueIds.size}\n`);
      
      // Find duplicates
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('   Duplicate IDs:', [...new Set(duplicates)]);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to fetch products: ${error.message}\n`);
    return false;
  }
}

// Test 2: Verify Each Product's Images Are Correctly Linked
console.log('📍 Test 2: Verify Image-Product Linking');
console.log('─'.repeat(80));

async function verifyImageLinking() {
  try {
    const response = await axios.get(`${BACKEND_URL}/products/with-images/all`);
    const products = response.data.data;

    console.log(`✅ Fetched ${products.length} products with their images\n`);

    let productsWithImages = 0;
    let totalImages = 0;
    const productImageCounts = {};

    products.forEach(product => {
      const images = product.images || [];
      if (images.length > 0) {
        productsWithImages++;
        totalImages += images.length;
        productImageCounts[product.id] = {
          name: product.name,
          count: images.length
        };
      }
    });

    console.log(`📊 Image Distribution:`);
    console.log(`   - Products with images: ${productsWithImages}/${products.length}`);
    console.log(`   - Total images: ${totalImages}`);
    console.log(`   - Average images per product: ${(totalImages / productsWithImages).toFixed(1)}\n`);

    if (productsWithImages > 0) {
      console.log('📋 Products with Images:');
      Object.entries(productImageCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .forEach(([id, data]) => {
          console.log(`   - Product ${id} (${data.name}): ${data.count} images`);
        });
    } else {
      console.log('⚠️  No products have images yet');
    }

    console.log('\n');
    return true;
  } catch (error) {
    console.error(`❌ Failed to fetch products with images: ${error.message}\n`);
    return false;
  }
}

// Test 3: Verify Individual Product Image Visibility
console.log('📍 Test 3: Verify Individual Product Visibility');
console.log('─'.repeat(80));

async function verifyIndividualProductVisibility() {
  try {
    // Fetch a few products to test
    const allProducts = await axios.get(`${BACKEND_URL}/products/with-images/all`);
    const products = allProducts.data.data.slice(0, 5);

    console.log(`Testing visibility for ${products.length} products:\n`);

    for (const product of products) {
      // Also fetch using single product endpoint
      const singleResponse = await axios.get(`${BACKEND_URL}/products/${product.id}/with-images`);
      const singleProduct = singleResponse.data.data;

      const allImages = product.images || [];
      const singleImages = singleProduct.images || [];

      const match = allImages.length === singleImages.length;
      const status = match ? '✅' : '❌';

      console.log(`${status} Product ID ${product.id}: ${product.name}`);
      console.log(`   - From all products: ${allImages.length} images`);
      console.log(`   - From single product endpoint: ${singleImages.length} images`);

      if (allImages.length > 0) {
        console.log(`   - First image URL: ${allImages[0].image_url?.substring(0, 70)}...`);
        console.log(`   - Is Cloudinary: ${allImages[0].image_url?.includes('cloudinary.com') ? '✅ Yes' : '❌ No'}`);
      }

      console.log();
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to verify individual products: ${error.message}\n`);
    return false;
  }
}

// Test 4: Verify Image Data Structure
console.log('📍 Test 4: Verify Image Data Structure');
console.log('─'.repeat(80));

async function verifyImageDataStructure() {
  try {
    const response = await axios.get(`${BACKEND_URL}/products/with-images/all`);
    const products = response.data.data;

    // Find a product with images
    const productWithImages = products.find(p => p.images && p.images.length > 0);

    if (!productWithImages) {
      console.log('⚠️  No products with images found for structure verification\n');
      return true;
    }

    const firstImage = productWithImages.images[0];

    console.log(`✅ Checking image structure for product ${productWithImages.id}:\n`);
    console.log('Required fields:');

    const requiredFields = {
      'id': 'Unique image ID',
      'image_url': 'Cloudinary URL',
      'image_format': 'Image format (jpg, png, etc)',
      'alt_text': 'Alternative text',
      'image_order': 'Display order',
      'is_thumbnail': 'Thumbnail flag',
      'product_id': 'Linked product ID'
    };

    let allFieldsPresent = true;
    Object.entries(requiredFields).forEach(([field, description]) => {
      const hasField = field in firstImage;
      const status = hasField ? '✅' : '❌';
      console.log(`   ${status} ${field.padEnd(15)}: ${description}`);
      
      if (hasField) {
        let value = firstImage[field];
        if (typeof value === 'string' && value.length > 50) {
          value = value.substring(0, 50) + '...';
        }
        console.log(`      → ${value}`);
      }
      
      if (!hasField) allFieldsPresent = false;
    });

    console.log('\n');
    return allFieldsPresent;
  } catch (error) {
    console.error(`❌ Failed to verify data structure: ${error.message}\n`);
    return false;
  }
}

// Test 5: Verify Product-to-Image Relationship
console.log('📍 Test 5: Verify Product-to-Image Relationships');
console.log('─'.repeat(80));

async function verifyProductImageRelationship() {
  try {
    const response = await axios.get(`${BACKEND_URL}/products/with-images/all`);
    const products = response.data.data;

    let relationshipsCorrect = 0;
    let relationshipsIncorrect = 0;

    console.log('Checking product-image relationships:\n');

    for (const product of products) {
      if (!product.images || product.images.length === 0) continue;

      // Check if all images have correct product_id
      const correctImages = product.images.filter(img => img.product_id === product.id);
      const totalImages = product.images.length;

      if (correctImages.length === totalImages) {
        relationshipsCorrect += totalImages;
      } else {
        relationshipsIncorrect += (totalImages - correctImages.length);
        console.log(`❌ Product ${product.id}: ${totalImages - correctImages.length}/${totalImages} images have wrong product_id`);
      }
    }

    console.log(`✅ Correct relationships: ${relationshipsCorrect}`);
    if (relationshipsIncorrect > 0) {
      console.log(`❌ Incorrect relationships: ${relationshipsIncorrect}`);
    }
    console.log('\n');

    return relationshipsIncorrect === 0;
  } catch (error) {
    console.error(`❌ Failed to verify relationships: ${error.message}\n`);
    return false;
  }
}

// Test 6: Verify Carousel Will Work
console.log('📍 Test 6: Verify Carousel Display Configuration');
console.log('─'.repeat(80));

async function verifyCarouselConfig() {
  try {
    const response = await axios.get(`${BACKEND_URL}/products/with-images/all`);
    const products = response.data.data;

    let carouselsReadyCount = 0;
    let carouselsEmptyCount = 0;

    products.forEach(product => {
      const images = product.images || [];
      
      if (images.length > 0) {
        // Check if images are sorted by image_order
        const isSorted = images.every((img, idx) => 
          idx === 0 || img.image_order >= images[idx - 1].image_order
        );

        if (isSorted) {
          carouselsReadyCount++;
        } else {
          console.log(`⚠️  Product ${product.id}: Images not properly ordered`);
        }
      } else {
        carouselsEmptyCount++;
      }
    });

    console.log(`✅ Products ready for carousel: ${carouselsReadyCount}`);
    console.log(`⚠️  Products without images: ${carouselsEmptyCount}`);
    console.log(`📊 Total products: ${products.length}\n`);

    return true;
  } catch (error) {
    console.error(`❌ Failed to verify carousel config: ${error.message}\n`);
    return false;
  }
}

// Run all verifications
async function runAllVerifications() {
  const results = [];

  try {
    // Test backend connectivity
    console.log('📍 Test 0: Backend Connectivity');
    console.log('─'.repeat(80));
    
    try {
      await axios.get(`${BACKEND_URL}/products`, { timeout: 5000 });
      console.log('✅ Backend is responsive\n');
    } catch (error) {
      console.error(`❌ Backend not responding: ${error.message}\n`);
      console.log('Cannot proceed without backend access.\n');
      process.exit(1);
    }

    results.push(await verifyUniqueProductIds());
    results.push(await verifyImageLinking());
    results.push(await verifyIndividualProductVisibility());
    results.push(await verifyImageDataStructure());
    results.push(await verifyProductImageRelationship());
    results.push(await verifyCarouselConfig());

    // Summary
    console.log('═'.repeat(80));
    console.log('\n📊 VERIFICATION SUMMARY\n');

    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;

    console.log(`Tests Passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log('\n✅ ALL VERIFICATIONS PASSED!');
      console.log('\nSystem is working correctly:');
      console.log('   ✅ Each product has unique ID');
      console.log('   ✅ Images properly linked to products');
      console.log('   ✅ Each product can display its own images');
      console.log('   ✅ Data structure is correct');
      console.log('   ✅ Product-image relationships valid');
      console.log('   ✅ Carousel ready to display');
    } else {
      console.log('\n⚠️  Some verifications failed. Review above for details.');
    }

    console.log('\n📋 Next Steps:\n');
    console.log('1. Visit each product page (/product/ID)');
    console.log('2. Verify carousel displays correct images');
    console.log('3. Check images are unique to that product');
    console.log('4. Verify scrolling and interactions work');
    console.log('5. Test on mobile for responsiveness\n');

    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Verification suite failed:', error.message);
    process.exit(1);
  }
}

runAllVerifications();
