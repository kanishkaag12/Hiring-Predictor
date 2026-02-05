#!/usr/bin/env node

/**
 * Test prediction with detailed logging to see Python validation
 */

import http from 'http';

// Test data: candidate with resume (14 non-zero features)
const testData = {
  jobId: 'test-job-1',
  userId: 1  // A user with resume data
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/shortlist/predict',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('[Test] Sending prediction request...');
console.log('[Test] Data:', testData);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('[Test] Response status:', res.statusCode);
    console.log('[Test] Response headers:', res.headers);
    console.log('[Test] Response body:');
    console.log(data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('[Test] Request error:', error);
  process.exit(1);
});

req.write(postData);
req.end();
