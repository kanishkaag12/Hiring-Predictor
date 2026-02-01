async function testJobs() {
  try {
    console.log("Testing /api/jobs endpoint...");
    const res = await fetch("http://localhost:5000/api/jobs?type=job");
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Jobs found: ${Array.isArray(data) ? data.length : 0}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log("\nFirst job:");
      console.log(JSON.stringify(data[0], null, 2).substring(0, 500));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testJobs();
