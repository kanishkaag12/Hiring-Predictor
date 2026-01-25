
import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    console.log("Checking users table schema...");
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    console.log("Columns in users table:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

    pool.end();
  } catch (err) {
    console.error("Error checking schema:", err);
    pool.end();
  }
}

checkSchema();
