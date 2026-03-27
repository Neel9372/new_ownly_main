const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ownly_db",
  password: "postgres",
  port: 5432,
});

async function addKYCColumns() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS id_proof_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS id_proof_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'NOT_SUBMITTED'
    `);
    console.log("KYC columns added successfully!");

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

addKYCColumns();
