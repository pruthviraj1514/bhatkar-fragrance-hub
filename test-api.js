require('dotenv').config();
const http = require('http');
const url = require('url');

const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
const parsedUrl = url.parse(apiUrl);

const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
  path: parsedUrl.pathname + '/products/with-images/all',
  method: 'GET'
};

const client = parsedUrl.protocol === 'https:' ? require('https') : http;

const req = client.request(options, (res) => {
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
