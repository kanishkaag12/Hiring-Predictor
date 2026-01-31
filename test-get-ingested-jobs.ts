/**
 * Test script for GET /api/jobs/ingested endpoint
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testIngestedJobsEndpoint() {
  console.log("=".repeat(60));
  console.log("Testing GET /api/jobs/ingested endpoint");
  console.log("=".repeat(60));
  
  try {
    console.log(`\n📡 Fetching ingested jobs from ${BASE_URL}/api/jobs/ingested\n`);
    
    const response = await fetch(`${BASE_URL}/api/jobs/ingested`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("\nResponse:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log(`\n✅ Test passed!`);
      console.log(`📊 Total ingested jobs: ${data.count}`);
      if (data.count > 0) {
        console.log(`\n📋 Sample job (first):`);
        console.log(JSON.stringify(data.jobs[0], null, 2));
      }
    } else {
      console.log("❌ Test failed!");
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
  
  console.log("\n" + "=".repeat(60));
}

testIngestedJobsEndpoint();
