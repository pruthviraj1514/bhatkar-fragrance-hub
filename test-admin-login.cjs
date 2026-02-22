const https = require('https');

const options = {
  hostname: 'bhatkar-fragrance-hub-1.onrender.com',
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(JSON.stringify({
  email: 'admin@bhatkar.com',
  password: 'admin123'
}));

req.end();
