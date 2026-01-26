import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read a test PDF
const testPdfPath = path.join(__dirname, 'uploads', 'resume-1769337262588-965948449.pdf');

if (!fs.existsSync(testPdfPath)) {
  console.error('Test PDF not found at:', testPdfPath);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(testPdfPath);

// Prepare multipart form data
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const fileField = `--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="test-resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;
const trailing = `\r\n--${boundary}--`;

const body = Buffer.concat([
  Buffer.from(fileField),
  fileBuffer,
  Buffer.from(trailing)
]);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/profile/resume',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
    'Cookie': 'connect.sid=test-session-id'
  }
};

console.log('Uploading resume to:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('File size:', fileBuffer.length, 'bytes');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log('Status:', res.statusCode);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(body);
req.end();
