const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../.env" });
const db = require("../db");

async function cleanAndSeed() {
  try {
    console.log("🔄 Resetting database...");

    // 1. Truncate all tables using CASCADE to wipe out all data and foreign key dependency links
    await db.query(`
      TRUNCATE TABLE 
        rental_distributions,
        transactions,
        investments,
        project_documents,
        project_milestones,
        builder_projects,
        property_leasing,
        property_funding,
        property_financials,
        properties,
        builder_verifications,
        users
      CASCADE;
    `);
    console.log("✅ Wiped all tables successfully.");

    // 2. Add license_url and kyc_rejection_reason columns to users table if they don't exist
    await db.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS license_url TEXT,
      ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
    `);
    console.log("✅ Ensured 'license_url' column exists in users table.");

    // 3. Hash admin password
    const email = "admin@ownly.in";
    const password = "Admin@1234";
    const fname = "Ownly";
    const lname = "Admin";
    const role = "ADMIN";

    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Seed admin
    const result = await db.query(
      `INSERT INTO users (fname, lname, email, password, role, kyc_status, wallet_status)
       VALUES ($1, $2, $3, $4, $5, 'VERIFIED', 'NOT_CONNECTED')
       RETURNING id, fname, lname, email, role`,
      [fname, lname, email, hashedPassword, role]
    );

    const admin = result.rows[0];
    console.log("✅ Admin seeded successfully!");
    console.log("─────────────────────────────────");
    console.log("   ID:       ", admin.id);
    console.log("   Name:     ", admin.fname, admin.lname);
    console.log("   Email:    ", admin.email);
    console.log("   Password:  Admin@1234");
    console.log("   Role:     ", admin.role);
    console.log("─────────────────────────────────");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup & Seeding failed:", err.message);
    process.exit(1);
  }
}

cleanAndSeed();
