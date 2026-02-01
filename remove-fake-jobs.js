import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function removeTechIndiaSolutions() {
  const client = await pool.connect();
  try {
    // First, check if any Tech India Solutions jobs exist
    const checkResult = await client.query(
      'SELECT id, title, company FROM jobs WHERE company ILIKE $1 ORDER BY created_at DESC',
      ['%Tech India Solutions%']
    );
    
    console.log(`Found ${checkResult.rows.length} Tech India Solutions jobs:`);
    checkResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Title: ${row.title}, Company: ${row.company}`);
    });

    if (checkResult.rows.length > 0) {
      // Delete all Tech India Solutions jobs
      const deleteResult = await client.query(
        'DELETE FROM jobs WHERE company ILIKE $1',
        ['%Tech India Solutions%']
      );
      
      console.log(`\n✅ Deleted ${deleteResult.rowCount} fake jobs from Tech India Solutions`);
    } else {
      console.log('\nℹ️ No Tech India Solutions jobs found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

removeTechIndiaSolutions();
