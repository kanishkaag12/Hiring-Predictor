/**
 * Simple wrapper that loads .env before importing the test script
 * This ensures DATABASE_URL is available when storage.ts loads
 */

import * as path from 'path';

// Load .env IMMEDIATELY before anything else
const envPath = path.join(process.cwd(), '.env');
console.log(`[wrapper] Loading .env from: ${envPath}`);

// Use require to load dotenv synchronously
require('dotenv').config({ path: envPath });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('[wrapper] ERROR: DATABASE_URL still not set after dotenv.config()');
  console.error(`[wrapper] Checked path: ${envPath}`);
  process.exit(1);
}

console.log('[wrapper] ✓ DATABASE_URL loaded successfully');
console.log(`[wrapper] Environment: ${process.env.NODE_ENV || 'development'}`);

// Now import and run the test
require('./dist/test-resume-predictions-standalone.js');
