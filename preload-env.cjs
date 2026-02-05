/**
 * Preload hook to load .env BEFORE any other modules
 * This ensures DATABASE_URL is available when storage.ts initializes
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

console.log('[preload] ✓ Environment variables loaded');
console.log(`[preload] DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
