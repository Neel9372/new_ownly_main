// Migration: add project_updates table
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../db");

async function migrate() {
  try {
    // 1. Create project_updates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_updates (
          id SERIAL PRIMARY KEY,
          project_id INT REFERENCES builder_projects(id) ON DELETE CASCADE,
          author VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          photos_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Migration successful: created project_updates table");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
