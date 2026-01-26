
import "dotenv/config";
import { storage, pool } from "./storage";

async function test() {
  try {
    console.log("Testing DB connection...");
    try {
        const client = await pool.connect();
        console.log("DB connection successful.");
        client.release();
    } catch (dbErr) {
        console.error("DB Connection FAILED:", dbErr);
        process.exit(1);
    }

    const testEmail = `test_${Date.now()}@example.com`;
    console.log(`Attempting to create user with email: ${testEmail}`);

    // Create a user directly via storage
    // Note: This bypasses hashing, just testing the DB insert
    const user = await storage.createUser({
      email: testEmail,
      password: "hashed_dummy_password", 
      name: "Debug User"
    });

    console.log("User created successfully with ID:", user.id);

    // Clean up
    // await pool.query("DELETE FROM users WHERE id = $1", [user.id]);
    // console.log("Test user deleted.");

  } catch (err: any) {
    console.error("DEBUG ERROR STACK:", err.stack);
    console.error("DEBUG ERROR JSON:", JSON.stringify(err, null, 2));
  } finally {
    process.exit(0); // Force exit
  }
}

test();
