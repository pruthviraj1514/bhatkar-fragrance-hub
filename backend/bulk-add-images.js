import axios from 'axios';
import readline from 'readline';

const api = axios.create({
  baseURL: 'https://bhatkar-fragrance-hub-1.onrender.com/api'
});

// Get admin token - you need to provide this
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function addImagesToProducts() {
  try {
    console.log('🖼️  BULK ADD IMAGES TO PRODUCTS\n');
    
    // Ask for admin token
    const adminToken = await question('Enter your admin token: ');
    
    if (!adminToken) {
      console.log('❌ Admin token required');
      rl.close();
      return;
    }
    
    // Set auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    
    // Get all products
    console.log('\n📦 Fetching products...');
    const productsRes = await api.get('/products');
    const products = productsRes.data.data;
    console.log(`✅ Found ${products.length} products\n`);
    
    // Sample images to use
    const sampleImages = [
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=500&fit=crop'
    ];
    
    // Add images to each product
    let successCount = 0;
    let skippedCount = 0;
    
    for (const product of products) {
      try {
        // Check if product already has images
        const checkRes = await api.get(`/products/${product.id}/with-images`);
        if (checkRes.data.data.images && checkRes.data.data.images.length > 0) {
          console.log(`⏭️  Product ${product.id} (${product.name}): Already has images - SKIPPED`);
          skippedCount++;
          continue;
        }
        
        // Add sample images to product
        console.log(`📤 Adding images to product ${product.id} (${product.name})...`);
        
        const imagesToAdd = sampleImages.slice(0, Math.ceil(Math.random() * 4));
        
        const response = await api.post(`/products/${product.id}/images`, {
          images: imagesToAdd.map((url, idx) => ({
            imageUrl: url,
            altText: `Product Image ${idx + 1}`,
            imageOrder: idx + 1,
            isThumbnail: idx === 0,
            imageFormat: 'jpg'
          }))
        });
        
        console.log(`   ✅ Added ${response.data.data.length} images\n`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}\n`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Products updated: ${successCount}`);
    console.log(`   ⏭️  Products skipped: ${skippedCount}`);
    console.log(`   📦 Total products: ${products.length}`);
    
    rl.close();
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    rl.close();
  }
}

addImagesToProducts();
