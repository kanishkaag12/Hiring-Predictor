#!/usr/bin/env node
/**
 * Test Neon Database Connection
 * 
 * This script tests the connection to Neon PostgreSQL database
 * with proper timeout handling for cold starts.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

// Extract host for display
const dbHost = DATABASE_URL.match(/@([^/]+)/)?.[1] || 'unknown';

console.log('\n🔍 Neon Database Connection Test');
console.log('='.repeat(50));
console.log(`📍 Database Host: ${dbHost}`);
console.log(`⏱️  Connection Timeout: 30 seconds`);
console.log(`🔄 Max Retries: 3`);
console.log('='.repeat(50));

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection(attempt = 1, maxRetries = 3) {
  try {
    console.log(`\n[Attempt ${attempt}/${maxRetries}] Connecting to database...`);
    const startTime = Date.now();
    
    const client = await pool.connect();
    const connectionTime = Date.now() - startTime;
    
    console.log(`✓ Connection established in ${connectionTime}ms`);
    
    // Test query
    const queryStart = Date.now();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    const queryTime = Date.now() - queryStart;
    
    console.log(`✓ Query executed in ${queryTime}ms`);
    console.log(`📅 Database Time: ${result.rows[0].current_time}`);
    console.log(`🗄️  Database Version: ${result.rows[0].db_version.split(' ').slice(0, 2).join(' ')}`);
    
    client.release();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE CONNECTION SUCCESSFUL');
    console.log('='.repeat(50));
    
    if (connectionTime > 5000) {
      console.log('\n⚠️  Note: Connection took longer than 5 seconds.');
      console.log('   This is normal for Neon free tier during cold starts.');
      console.log('   The database was likely in sleep mode and had to wake up.');
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (err) {
    const connectionTime = Date.now() - startTime;
    console.error(`❌ Connection failed after ${connectionTime}ms`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code || 'UNKNOWN'}`);
    
    if (attempt < maxRetries) {
      const waitTime = attempt * 3000;
      console.log(`\n⏳ Waiting ${waitTime/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return testConnection(attempt + 1, maxRetries);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('❌ DATABASE CONNECTION FAILED');
    console.log('='.repeat(50));
    
    // Provide diagnostics
    console.log('\n🔍 Diagnostic Information:');
    
    if (err.message.includes('timeout') || err.code === 'ETIMEDOUT') {
      console.log('   → Connection timeout occurred');
      console.log('   → Possible causes:');
      console.log('     1. Neon database is waking up from sleep (free tier)');
      console.log('     2. Network connectivity issues');
      console.log('     3. Firewall blocking connection');
      console.log('   → Solutions:');
      console.log('     1. Wait 10-15 seconds and try again');
      console.log('     2. Check your internet connection');
      console.log('     3. Consider upgrading from Neon free tier');
    } else if (err.message.includes('ENOTFOUND') || err.code === 'ENOTFOUND') {
      console.log('   → DNS resolution failed');
      console.log('   → Check your DATABASE_URL in .env file');
    } else if (err.message.includes('authentication') || err.message.includes('password')) {
      console.log('   → Authentication failed');
      console.log('   → Check credentials in DATABASE_URL');
    } else {
      console.log(`   → Unexpected error: ${err.message}`);
    }
    
    await pool.end();
    process.exit(1);
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
