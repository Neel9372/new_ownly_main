const { Pool } = require("pg");
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ownly_db",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function checkUsers() {
  try {
    const result = await pool.query(
      "SELECT id, fname, lname, email, role, builder_status, company_name, substring(license_url from 1 for 30) as license_prefix FROM users"
    );
    console.log("All users in DB:");
    result.rows.forEach(r => console.log(JSON.stringify(r)));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

checkUsers();
