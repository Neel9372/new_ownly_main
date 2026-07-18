const { Pool } = require("pg");
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ownly_db",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function addBuilderInfoColumns() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS rera_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS gst_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS portfolio_url TEXT
    `);
    console.log("Builder info columns (rera_number, gst_number, website, portfolio_url) added successfully!");

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

addBuilderInfoColumns();
