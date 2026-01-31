import { config } from 'dotenv';
import pg from 'pg';

config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 60000,
  statement_timeout: 60000,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkJobsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Check if jobs table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jobs'
      );
    `);
    
    console.log(`\n📊 Jobs table exists: ${tableCheck.rows[0].exists}`);
    
    if (tableCheck.rows[0].exists) {
      // Get all columns from jobs table
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'jobs'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Jobs table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`   • ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}`);
      });
      
      // Check for indexes
      const indexResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'jobs';
      `);
      
      console.log('\n📑 Jobs table indexes:');
      indexResult.rows.forEach(idx => {
        console.log(`   • ${idx.indexname}`);
      });
      
      // Check row count
      const countResult = await client.query('SELECT COUNT(*) FROM jobs;');
      console.log(`\n📈 Total jobs in database: ${countResult.rows[0].count}`);
    } else {
      console.log('\n❌ Jobs table does not exist! Run migrations first.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkJobsTable();
