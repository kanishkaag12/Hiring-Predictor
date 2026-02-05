/**
 * Test RandomForest fix: verify 13-feature vector works
 */

// Using built-in fetch (Node 18+)

const API_URL = 'http://localhost:5000/api/shortlist/predict';

// Test data with known good values
const testPayload = {
  userId: 'test-user-123',
  jobId: '3b17755c-6319-45f6-bd32-fe7fb6a12a16',
};

async function testRandomForestFix() {
  console.log('========================================');
  console.log('TESTING RANDOMFOREST FIX (13 FEATURES)');
  console.log('========================================\n');

  try {
    console.log('Sending prediction request...');
    console.log(`POST ${API_URL}`);
    console.log(`Payload:`, testPayload);
    console.log('');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS: RandomForest prediction worked!');
      console.log('');
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');

      if (data.shortlist_probability !== undefined && data.shortlist_probability !== 0) {
        console.log('✅ CRITICAL CHECK PASSED: RandomForest returned non-zero value');
        console.log(`   Score: ${(data.shortlist_probability * 100).toFixed(1)}%`);
        console.log('');
        console.log('🎉 FIX VERIFIED: 13-feature vector works correctly!');
      } else if (data.shortlist_probability === 0) {
        console.log('⚠️  RandomForest returned 0 (profile may be empty or weak)');
      } else {
        console.log('⚠️  Unexpected response format');
      }
    } else {
      console.log('❌ ERROR: Request failed');
      console.log(`Status: ${response.status}`);
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));

      if (data.error && data.error.includes('RandomForest returned invalid strength')) {
        console.log('');
        console.log('❌ CRITICAL: Still getting 0 from RandomForest');
        console.log('The 13-feature fix may not have worked');
      }
    }
  } catch (error) {
    console.error('❌ ERROR: Request failed');
    console.error(error instanceof Error ? error.message : String(error));
  }

  console.log('');
  console.log('========================================');
}

testRandomForestFix();
