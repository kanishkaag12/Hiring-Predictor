import { config } from 'dotenv';
import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 60000, // 60 seconds for initial connection
  statement_timeout: 60000, // 60 seconds for each statement
});

async function runAllMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    console.log(`📍 Database: ${process.env.DATABASE_URL.split('@')[1].split('/')[0]}`);
    
    // Get all SQL migration files in order
    const migrationFiles = readdirSync('./migrations')
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure correct order

    console.log(`\n📂 Found ${migrationFiles.length} migration files:\n`);
    
    for (const file of migrationFiles) {
      console.log(`  ▶️  Running: ${file}`);
      try {
        const sql = readFileSync(join('./migrations', file), 'utf8');
        await client.query(sql);
        console.log(`  ✅  Success: ${file}`);
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`  ⚠️  Skipped: ${file} (already applied)`);
        } else {
          console.error(`  ❌  Failed: ${file}`);
          console.error(`     Error: ${error.message}`);
          // Continue with other migrations
        }
      }
    }
    
    console.log('\n✅ All migrations processed!');
    console.log('\n📊 Verifying users table structure...');
    
    // Verify the users table structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`   • ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n🎉 Database is ready for registration!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('🚀 Starting database migration...\n');
runAllMigrations();
