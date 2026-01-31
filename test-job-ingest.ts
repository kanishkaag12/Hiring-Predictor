/**
 * Test script for POST /api/jobs/ingest endpoint
 * 
 * This script tests various scenarios:
 * 1. Single job object (n8n format)
 * 2. Array of jobs
 * 3. Validation errors
 * 4. Duplicate handling
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Sample job data in n8n format
const sampleJob = {
  title: "Senior Full Stack Developer",
  company: "Tech India Solutions",
  location: "Bangalore, Karnataka, India",
  city: "Bangalore",
  state: "Karnataka",
  country: "India",
  apply_url: "https://example.com/jobs/test-job-" + Date.now(),
  source: "n8n-rapidapi-jsearch",
  google_job_link: "https://jobs.google.com/test-" + Date.now(),
  posted_at: new Date().toISOString(),
  employment_type: "Full-time",
  experience_level: "Mid",
  salary_range: "₹12-18 LPA",
  skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
  is_internship: 0
};

async function testEndpoint(testName: string, payload: any, expectSuccess: boolean = true) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/jobs/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (expectSuccess && response.ok) {
      console.log("✅ Test passed!");
    } else if (!expectSuccess && !response.ok) {
      console.log("✅ Test passed (expected failure)!");
    } else {
      console.log("❌ Test failed!");
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("Testing POST /api/jobs/ingest endpoint");
  console.log("=".repeat(60));

  // Test 1: Single job object (n8n format)
  await testEndpoint("Single job object (n8n format)", sampleJob);

  // Test 2: Array of jobs
  await testEndpoint("Array of jobs", [
    { ...sampleJob, apply_url: "https://example.com/jobs/test-1-" + Date.now() },
    { ...sampleJob, apply_url: "https://example.com/jobs/test-2-" + Date.now(), title: "Junior Developer" }
  ]);

  // Test 3: Jobs wrapper format
  await testEndpoint("Jobs array in wrapper object", {
    jobs: [
      { ...sampleJob, apply_url: "https://example.com/jobs/test-3-" + Date.now() }
    ]
  });

  // Test 4: Missing required field
  await testEndpoint("Missing required field (title)", {
    company: "Test Company",
    apply_url: "https://example.com/jobs/test-missing"
  }, false);

  // Test 5: Duplicate job (same apply_url)
  const duplicateUrl = "https://example.com/jobs/duplicate-test-" + Date.now();
  await testEndpoint("First job with unique URL", {
    ...sampleJob,
    apply_url: duplicateUrl
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  await testEndpoint("Duplicate job (same apply_url)", {
    ...sampleJob,
    apply_url: duplicateUrl,
    title: "Different Title but Same URL"
  });

  console.log("\n" + "=".repeat(60));
  console.log("All tests completed!");
  console.log("=".repeat(60));
}

runTests().catch(console.error);
