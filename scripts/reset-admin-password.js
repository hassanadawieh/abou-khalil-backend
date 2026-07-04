/**
 * Reset the default superAdmin password for local/dev recovery.
 * Usage: node scripts/reset-admin-password.js
 */
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || 'hassan';
  const password = process.env.SEED_ADMIN_PASSWORD || 'P@ssw0rd';
  const phoneNumber = process.env.SEED_ADMIN_PHONE || '0000000000';

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'my_new_db',
  });

  await client.connect();

  const roleResult = await client.query(
    `SELECT id FROM roles WHERE name = 'superAdmin' LIMIT 1`,
  );
  if (roleResult.rows.length === 0) {
    throw new Error('superAdmin role not found. Run npm run seed first.');
  }
  const roleId = roleResult.rows[0].id;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await client.query(
    `SELECT id FROM users WHERE username = $1 LIMIT 1`,
    [username],
  );

  if (existing.rows.length === 0) {
    await client.query(
      `INSERT INTO users (username, "phoneNumber", password, role_id, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [username, phoneNumber, hashedPassword, roleId],
    );
    console.log(`Created user '${username}'`);
  } else {
    await client.query(
      `UPDATE users
       SET password = $1, "phoneNumber" = $2, role_id = $3, "updatedAt" = NOW()
       WHERE username = $4`,
      [hashedPassword, phoneNumber, roleId, username],
    );
    console.log(`Reset password for user '${username}'`);
  }

  await client.end();
  console.log('Done. You can log in with the configured admin credentials.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
