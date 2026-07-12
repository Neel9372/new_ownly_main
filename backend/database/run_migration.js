// Run the blockchain columns migration
require("dotenv").config({ path: "../.env" });
const db = require("../db");

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS on_chain_property_id INT,
        ADD COLUMN IF NOT EXISTS token_address VARCHAR(255)
    `);
    console.log("✅ Migration successful: added on_chain_property_id and token_address columns");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
