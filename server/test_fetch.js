import http from 'node:http';

const req = http.get('http://127.0.0.1:5000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log(`Data: ${data}`);
  });
});

req.on('error', (err) => {
  console.error('Fetch error:', err.message);
});
