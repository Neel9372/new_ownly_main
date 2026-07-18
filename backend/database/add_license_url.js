const { Pool } = require("pg");
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ownly_db",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function addLicenseUrlColumn() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS license_url TEXT,
      ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT
    `);
    console.log("Columns added successfully!");

    // Verify columns exist
    const result = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log("\nCurrent users table columns:");
    result.rows.forEach((col) => console.log(`  - ${col.column_name} (${col.data_type})`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

addLicenseUrlColumn();
