import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bhatkar-fragrance-hub-1.onrender.com/api'
});

async function testAPI() {
  try {
    console.log('🔍 Testing GET /products/with-images/all\n');
    const response = await api.get('/products/with-images/all');
    console.log('✅ Status:', response.status);
    console.log('\n📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
