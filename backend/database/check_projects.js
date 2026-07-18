const { Pool } = require("pg");
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ownly_db",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function checkProjects() {
  try {
    const result = await pool.query(
      `SELECT bp.*, 
              u.fname, u.lname, u.email, u.company_name,
              COUNT(DISTINCT pd.id) as document_count,
              COUNT(DISTINCT pm.id) as milestone_count
       FROM builder_projects bp
       JOIN users u ON bp.builder_id = u.id
       LEFT JOIN project_documents pd ON bp.id = pd.project_id
       LEFT JOIN project_milestones pm ON bp.id = pm.project_id
       WHERE bp.status IN ('PENDING', 'APPROVED', 'LIVE', 'COMPLETED')
       GROUP BY bp.id, u.fname, u.lname, u.email, u.company_name
       ORDER BY bp.created_at ASC`
    );
    console.log("Pending/active projects query succeeded! Projects count:", result.rows.length);
  } catch (err) {
    console.error("Error in getPendingProjects query:", err.message);
  } finally {
    pool.end();
  }
}

checkProjects();
