
import 'dotenv/config';
import pg from 'pg';

async function main() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        console.log('---SCHEMA_START---');
        console.log(JSON.stringify(res.rows));
        console.log('---SCHEMA_END---');
    } catch (err) {
        console.error('Error fetching schema:', err);
    } finally {
        await pool.end();
    }
}

main();
