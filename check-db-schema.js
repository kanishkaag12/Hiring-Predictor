
require('dotenv').config();
const pg = require('pg');

async function main() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        `);
        console.log('Columns in users table:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error fetching schema:', err);
    } finally {
        await pool.end();
    }
}

main();
