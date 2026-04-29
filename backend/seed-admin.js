/**
 * OWNLY — Seed Admin User
 * 
 * Creates an admin user in the database.
 * 
 * Admin Credentials:
 *   Email:    admin@ownly.in
 *   Password: Admin@123
 *   Role:     ADMIN
 * 
 * Run: node seed-admin.js
 */

const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config({ path: "../.env" });

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "ownly_db",
});

async function seedAdmin() {
  const email = "admin@ownly.in";
  const password = "Admin@123";
  const fname = "Ownly";
  const lname = "Admin";
  const role = "ADMIN";

  try {
    // Check if admin already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log("✅ Admin user already exists (id:", existing.rows[0].id, ")");
      console.log("\n📧 Email:    admin@ownly.in");
      console.log("🔑 Password: Admin@123");
      console.log("👑 Role:     ADMIN");
      await pool.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user with KYC pre-verified
    const result = await pool.query(
      `INSERT INTO users (fname, lname, email, password, role, kyc_status, wallet_status)
       VALUES ($1, $2, $3, $4, $5, 'VERIFIED', 'NOT_CONNECTED')
       RETURNING id, fname, lname, email, role, kyc_status`,
      [fname, lname, email, hashedPassword, role]
    );

    const admin = result.rows[0];
    console.log("✅ Admin user created successfully!");
    console.log("─────────────────────────────────");
    console.log("   ID:       ", admin.id);
    console.log("   Name:     ", admin.fname, admin.lname);
    console.log("   Email:    ", admin.email);
    console.log("   Password:  Admin@123");
    console.log("   Role:     ", admin.role);
    console.log("   KYC:      ", admin.kyc_status);
    console.log("─────────────────────────────────");

  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
