import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/products/with-images/all',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log(`Response:`, data.substring(0, 500));
    try {
      const json = JSON.parse(data);
      console.log(`\nParsed JSON:`);
      console.log(`  Status: ${json.status}`);
      console.log(`  Total products: ${json.total}`);
      if (json.data && json.data.length > 0) {
        console.log(`  First product: ${json.data[0].name}`);
        console.log(`  First product images: ${json.data[0].images ? json.data[0].images.length : 0}`);
      }
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
