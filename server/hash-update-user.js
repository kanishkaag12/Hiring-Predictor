/*
One-off script to hash a plaintext password using the same scrypt settings
used by server/auth.ts and update the user's password in the database.

Usage (PowerShell):
$Env:DATABASE_URL = "postgresql://user:pass@host:5432/db"
$Env:EMAIL = "user@example.com"
$Env:NEW_PASSWORD = "newplaintext"
node server/hash-update-user.js

Make sure the process has access to the same DATABASE_URL the app uses.
*/

const { Pool } = require('pg');
const { scryptSync, randomBytes } = require('crypto');

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = scryptSync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const { DATABASE_URL, EMAIL, NEW_PASSWORD } = process.env;
  if (!DATABASE_URL) return console.error('DATABASE_URL is required');
  if (!EMAIL) return console.error('EMAIL is required');
  if (!NEW_PASSWORD) return console.error('NEW_PASSWORD is required');

  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT id, email, password FROM users WHERE email = $1', [EMAIL]);
      if (res.rowCount === 0) return console.error('No user found for', EMAIL);
      const user = res.rows[0];
      const hashed = hashPassword(NEW_PASSWORD);
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
      console.log('Updated password for', EMAIL);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
