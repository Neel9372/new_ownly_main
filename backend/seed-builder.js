/**
 * OWNLY — Seed Builder User
 * 
 * Creates a default builder user in the database.
 * 
 * Builder Credentials:
 *   Email:    builder@ownly.in
 *   Password: Builder@123
 *   Role:     BUILDER
 *   Status:   VERIFIED
 * 
 * Run: node seed-builder.js
 */

const bcrypt = require("bcrypt");
const pool = require("./db");

async function seedBuilder() {
  const email = "builder@ownly.in";
  const password = "Builder@123";
  const fname = "Ownly";
  const lname = "Builder";
  const role = "BUILDER";

  try {
    // Check if builder already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log("✅ Builder user already exists (id:", existing.rows[0].id, ")");
      console.log("\n📧 Email:    builder@ownly.in");
      console.log("🔑 Password: Builder@123");
      console.log("👑 Role:     BUILDER");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert builder user with VERIFIED status
    const result = await pool.query(
      `INSERT INTO users (fname, lname, email, password, role, builder_status, kyc_status, wallet_status)
       VALUES ($1, $2, $3, $4, $5, 'VERIFIED', 'VERIFIED', 'NOT_CONNECTED')
       RETURNING id, fname, lname, email, role, builder_status`,
      [fname, lname, email, hashedPassword, role]
    );

    const builder = result.rows[0];
    console.log("✅ Builder user created successfully!");
    console.log("─────────────────────────────────");
    console.log("   ID:       ", builder.id);
    console.log("   Name:     ", builder.fname, builder.lname);
    console.log("   Email:    ", builder.email);
    console.log("   Password:  Builder@123");
    console.log("   Role:     ", builder.role);
    console.log("   Status:   ", builder.builder_status);
    console.log("─────────────────────────────────");

  } catch (err) {
    console.error("❌ Error seeding builder:", err.message);
  } finally {
    await pool.end();
  }
}

seedBuilder();
