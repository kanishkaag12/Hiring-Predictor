
import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixSchema() {
  try {
    console.log("Attempting to add interest_roles column...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS interest_roles JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Successfully added interest_roles column (if it didn't exist).");
    
    // Also check for user_type which might be missing
    console.log("Attempting to add user_type column...");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS user_type TEXT;
    `);
    console.log("Successfully added user_type column (if it didn't exist).");

    pool.end();
  } catch (err) {
    console.error("Error fixing schema:", err);
    pool.end();
  }
}

fixSchema();
