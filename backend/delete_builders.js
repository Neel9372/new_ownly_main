const db = require("./db");

async function deleteBuilders() {
  try {
    console.log("Deleting builder records...");
    
    // Delete associated tables to avoid foreign key issues
    await db.query(`
      DELETE FROM builder_verifications 
      WHERE builder_id IN (SELECT id FROM users WHERE role = 'BUILDER');
    `);
    console.log("Deleted matching builder_verifications");

    await db.query(`
      DELETE FROM project_milestones 
      WHERE project_id IN (SELECT id FROM builder_projects WHERE builder_id IN (SELECT id FROM users WHERE role = 'BUILDER'));
    `);
    console.log("Deleted matching project_milestones");

    await db.query(`
      DELETE FROM project_documents 
      WHERE project_id IN (SELECT id FROM builder_projects WHERE builder_id IN (SELECT id FROM users WHERE role = 'BUILDER'));
    `);
    console.log("Deleted matching project_documents");

    await db.query(`
      DELETE FROM builder_projects 
      WHERE builder_id IN (SELECT id FROM users WHERE role = 'BUILDER');
    `);
    console.log("Deleted matching builder_projects");

    const result = await db.query(`
      DELETE FROM users 
      WHERE role = 'BUILDER'
      RETURNING id, email;
    `);
    console.log(`Successfully deleted ${result.rowCount} builder(s):`, result.rows);
  } catch (err) {
    console.error("Error deleting builders:", err);
  } finally {
    db.end();
  }
}

deleteBuilders();
