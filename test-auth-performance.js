#!/usr/bin/env node
/**
 * Test script to measure and compare authentication performance
 * Usage: node test-auth-performance.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function measureLoginTime(email, password) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      duration,
      status: response.status,
      message: data.message || 'Success',
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      duration: endTime - startTime,
      status: 0,
      message: error.message,
    };
  }
}

async function testRegistration(email, password, name) {
  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });
    
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function runTests() {
  log('\n=== HirePulse Authentication Performance Test ===\n', 'cyan');
  log(`Testing against: ${API_BASE}`, 'blue');
  
  // Test credentials
  const testEmail = `test-${Date.now()}@hirepulse.test`;
  const testPassword = 'TestPassword123!';
  const testName = 'Performance Test User';
  
  // Step 1: Register new user
  log('\n[1/4] Creating test user...', 'yellow');
  const registerResult = await testRegistration(testEmail, testPassword, testName);
  
  if (!registerResult.success) {
    log(`✗ Registration failed: ${registerResult.message}`, 'red');
    log('\nMake sure your server is running on ' + API_BASE, 'yellow');
    process.exit(1);
  }
  log('✓ Test user created', 'green');
  
  // Wait a bit for DB to settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Test initial login (might trigger password migration)
  log('\n[2/4] Testing initial login (with potential migration)...', 'yellow');
  const login1 = await measureLoginTime(testEmail, testPassword);
  
  if (!login1.success) {
    log(`✗ Login failed: ${login1.message} (${login1.status})`, 'red');
  } else {
    log(`✓ Login successful in ${login1.duration}ms`, 'green');
  }
  
  // Step 3: Test second login (should be optimized)
  log('\n[3/4] Testing optimized login (after migration)...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 500));
  const login2 = await measureLoginTime(testEmail, testPassword);
  
  if (!login2.success) {
    log(`✗ Login failed: ${login2.message} (${login2.status})`, 'red');
  } else {
    log(`✓ Login successful in ${login2.duration}ms`, 'green');
  }
  
  // Step 4: Run multiple tests for average
  log('\n[4/4] Running performance benchmark (5 attempts)...', 'yellow');
  const times = [];
  
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = await measureLoginTime(testEmail, testPassword);
    if (result.success) {
      times.push(result.duration);
      process.stdout.write('.');
    } else {
      process.stdout.write('✗');
    }
  }
  
  console.log(''); // New line after dots
  
  // Calculate statistics
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    log('\n=== Performance Results ===', 'cyan');
    log(`Average login time: ${avg.toFixed(0)}ms`, avg < 2000 ? 'green' : 'yellow');
    log(`Fastest: ${min}ms | Slowest: ${max}ms`, 'blue');
    log(`Successful attempts: ${times.length}/5`, 'blue');
    
    // Performance evaluation
    log('\n=== Performance Evaluation ===', 'cyan');
    if (avg < 1500) {
      log('🚀 EXCELLENT: Login performance is optimal!', 'green');
      log('   Email/password login is now comparable to OAuth.', 'green');
    } else if (avg < 2500) {
      log('✓ GOOD: Login performance is acceptable.', 'green');
      log('   Consider checking database connection latency.', 'yellow');
    } else if (avg < 4000) {
      log('⚠ FAIR: Login is functional but could be faster.', 'yellow');
      log('   Check: Database latency, connection pool, network.', 'yellow');
    } else {
      log('✗ SLOW: Login performance needs attention.', 'red');
      log('   Review: Database health, Neon region, pool settings.', 'red');
    }
    
    // Comparison with expected times
    log('\n=== Expected Performance ===', 'cyan');
    log('Development (in-memory sessions): 1000-2000ms', 'blue');
    log('Production (PostgreSQL sessions): 1500-3000ms', 'blue');
    log('OAuth login (for comparison):     500-1500ms', 'blue');
    
  } else {
    log('\n✗ All login attempts failed', 'red');
  }
  
  log('\n=== Test Complete ===\n', 'cyan');
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test failed with error: ${error.message}`, 'red');
  process.exit(1);
});
