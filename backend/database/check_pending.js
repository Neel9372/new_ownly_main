const { Pool } = require("pg");
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ownly_db",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function checkPending() {
  try {
    const result = await pool.query(
      `SELECT id, fname, lname, email, company_name, rera_number, gst_number, 
              website, portfolio_url, builder_status, license_url, created_at
       FROM users 
       WHERE role = 'BUILDER' AND builder_status = 'PENDING'
       ORDER BY created_at ASC`
    );
    console.log("Pending builders:");
    result.rows.forEach(r => console.log(JSON.stringify(r)));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

checkPending();
