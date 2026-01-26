import { config } from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const sql = readFileSync('./migrations/0005_add_profile_image.sql', 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
