
import "dotenv/config";
import { pool } from "./storage";

async function checkDb() {
  console.log("Checking DB connection...");
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  console.log("Database URL (masked):", maskedUrl);
  try {
    const client = await pool.connect();
    console.log("Connected to DB successfully.");
    
    const res = await client.query('SELECT NOW()');
    console.log("Current DB Time:", res.rows[0]);

    console.log("Checking for session table...");
    const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session'
      );
    `);
    console.log("Session table exists:", tableRes.rows[0].exists);

    client.release();
    process.exit(0);
  } catch (err) {
    console.error("DB Connection Error:", err);
    process.exit(1);
  }
}

checkDb();
