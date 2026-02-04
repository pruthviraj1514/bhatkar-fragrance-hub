import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bhatkar-fragrance-hub-1.onrender.com/api'
});

async function testProductDetail() {
  try {
    console.log('🔍 Testing GET /products/2/with-images\n');
    const response = await api.get('/products/2/with-images');
    console.log('✅ Status:', response.status);
    console.log('\n📊 Product:', response.data.data.name);
    console.log('Images count:', response.data.data.images.length);
    console.log('\nImages:');
    response.data.data.images.forEach((img, i) => {
      console.log(`  ${i+1}. ${img.alt_text} (${img.image_format}) - Thumbnail: ${img.is_thumbnail ? 'YES' : 'NO'}`);
      console.log(`     URL: ${img.image_url.substring(0, 80)}...`);
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProductDetail();
