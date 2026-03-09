const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  const queries = [
    'ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN profile_photo VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE transactions ADD COLUMN note VARCHAR(255) DEFAULT NULL'
  ];

  for (const q of queries) {
    try {
      await db.query(q);
      console.log(`Success: ${q}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`Already exists: ${e.message}`);
      } else {
        console.error(`Error with ${q}:`, e.message);
      }
    }
  }

  console.log('Database sync complete!');
  process.exit();
}

run();
