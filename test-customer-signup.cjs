const https = require('https');

const options = {
  hostname: 'bhatkar-fragrance-hub-1.onrender.com',
  path: '/api/auth/signup',
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
  firstname: 'Test',
  lastname: 'User',
  email: 'testuser@example.com',
  password: 'testpass123'
}));

req.end();
