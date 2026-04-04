const db = require("../db");

// Builder submits verification request
exports.submitVerification = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { company_name, rera_number, gst_number, website, portfolio_url } = req.body;

    // Check if user has BUILDER role
    const userCheck = await db.query(`SELECT role FROM users WHERE id = $1`, [user_id]);
    if (userCheck.rows[0].role !== "BUILDER") {
      return res.status(403).json({ error: "Only builders can submit verification" });
    }

    const result = await db.query(
      `UPDATE users 
       SET company_name = $1, rera_number = $2, gst_number = $3, 
           website = $4, portfolio_url = $5, builder_status = 'PENDING'
       WHERE id = $6
       RETURNING id, fname, lname, email, company_name, rera_number, builder_status`,
      [company_name, rera_number, gst_number, website, portfolio_url, user_id]
    );

    res.json({
      message: "Verification submitted. Awaiting admin review.",
      builder: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification submission failed" });
  }
};

// Admin - get all pending builder verifications
exports.getPendingBuilders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, fname, lname, email, company_name, rera_number, gst_number, 
              website, portfolio_url, builder_status, created_at
       FROM users 
       WHERE role = 'BUILDER' AND builder_status = 'PENDING'
       ORDER BY created_at ASC`
    );

    res.json({ pending_builders: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending builders" });
  }
};

// Admin - approve or reject builder
exports.reviewBuilder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status must be VERIFIED or REJECTED" });
    }

    const result = await db.query(
      `UPDATE users SET builder_status = $1 WHERE id = $2 AND role = 'BUILDER'
       RETURNING id, fname, lname, email, company_name, builder_status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Builder not found" });
    }

    res.json({
      message: `Builder ${status.toLowerCase()} successfully`,
      builder: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Builder review failed" });
  }
};

// Builder submits a new project
exports.submitProject = async (req, res) => {
  try {
    const builder_id = req.user.id;

    // Check builder is verified
    const builderCheck = await db.query(
      `SELECT builder_status, role FROM users WHERE id = $1`,
      [builder_id]
    );

    if (builderCheck.rows[0].role !== "BUILDER") {
      return res.status(403).json({ error: "Only builders can submit projects" });
    }

    if (builderCheck.rows[0].builder_status !== "VERIFIED") {
      return res.status(403).json({ 
        error: "Your account must be verified by admin before submitting projects" 
      });
    }

    const {
      title,
      property_type,
      location,
      description,
      rera_id,
      total_funding_goal,
      total_tokens,
      token_price,
      construction_start,
      expected_completion,
      funding_deadline,
    } = req.body;

    // Validate required fields
    if (!title || !location || !total_funding_goal || !total_tokens || !token_price) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const result = await db.query(
      `INSERT INTO builder_projects (
        builder_id, title, property_type, location,
        description, total_funding_goal, total_tokens,
        token_price, construction_start, expected_completion,
        funding_deadline
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        builder_id, title, property_type, location,
        description, total_funding_goal, total_tokens,
        token_price, construction_start, expected_completion,
        funding_deadline
      ]
    );

    res.json({
      message: "Project submitted successfully. Awaiting admin approval.",
      project: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Project submission failed" });
  }
};

// Builder uploads documents for a project
exports.uploadProjectDocuments = async (req, res) => {
  try {
    const builder_id = req.user.id;
    const { project_id } = req.params;
    const { document_type, document_url } = req.body;

    // Verify project belongs to this builder
    const projectCheck = await db.query(
      `SELECT id FROM builder_projects WHERE id = $1 AND builder_id = $2`,
      [project_id, builder_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await db.query(
      `INSERT INTO project_documents (project_id, document_type, document_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [project_id, document_type, document_url]
    );

    res.json({
      message: "Document uploaded successfully",
      document: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Document upload failed" });
  }
};

// Builder adds milestones to a project
exports.addMilestone = async (req, res) => {
  try {
    const builder_id = req.user.id;
    const { project_id } = req.params;
    const {
      milestone_name,
      description,
      funding_percentage,
      due_date,
    } = req.body;

    // Verify project belongs to this builder
    const projectCheck = await db.query(
      `SELECT id FROM builder_projects WHERE id = $1 AND builder_id = $2`,
      [project_id, builder_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check total funding percentage doesn't exceed 100
    const totalCheck = await db.query(
      `SELECT COALESCE(SUM(funding_percentage), 0) as total 
       FROM project_milestones WHERE project_id = $1`,
      [project_id]
    );

    const currentTotal = parseFloat(totalCheck.rows[0].total);
    if (currentTotal + parseFloat(funding_percentage) > 100) {
      return res.status(400).json({ 
        error: `Total milestone percentage cannot exceed 100%. Currently at ${currentTotal}%` 
      });
    }

    const result = await db.query(
      `INSERT INTO project_milestones 
        (project_id, milestone_name, description, funding_percentage, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [project_id, milestone_name, description, funding_percentage, due_date]
    );

    res.json({
      message: "Milestone added successfully",
      milestone: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add milestone" });
  }
};

// Builder gets their own projects
exports.getMyProjects = async (req, res) => {
  try {
    const builder_id = req.user.id;

    const projects = await db.query(
      `SELECT bp.*, 
              COUNT(DISTINCT pd.id) as document_count,
              COUNT(DISTINCT pm.id) as milestone_count
       FROM builder_projects bp
       LEFT JOIN project_documents pd ON bp.id = pd.project_id
       LEFT JOIN project_milestones pm ON bp.id = pm.project_id
       WHERE bp.builder_id = $1
       GROUP BY bp.id
       ORDER BY bp.created_at DESC`,
      [builder_id]
    );

    res.json({ projects: projects.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Admin - get all pending projects
exports.getPendingProjects = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT bp.*, 
              u.fname, u.lname, u.email, u.company_name,
              COUNT(DISTINCT pd.id) as document_count,
              COUNT(DISTINCT pm.id) as milestone_count
       FROM builder_projects bp
       JOIN users u ON bp.builder_id = u.id
       LEFT JOIN project_documents pd ON bp.id = pd.project_id
       LEFT JOIN project_milestones pm ON bp.id = pm.project_id
       WHERE bp.status = 'PENDING'
       GROUP BY bp.id, u.fname, u.lname, u.email, u.company_name
       ORDER BY bp.created_at ASC`
    );

    res.json({ pending_projects: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending projects" });
  }
};

// Admin - approve or reject project
exports.reviewProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { status, rejection_reason } = req.body;
    const admin_id = req.user.id;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status must be APPROVED or REJECTED" });
    }

    const result = await db.query(
      `UPDATE builder_projects
       SET status = $1, rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [status, rejection_reason || null, project_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // If approved, automatically create property listing
    if (status === "APPROVED") {
      const project = result.rows[0];

      await db.query(
        `INSERT INTO properties (
          title, property_type, location,
          source, builder_project_id, listed_by,
          status, rera_id
        ) VALUES ($1,$2,$3,'BUILDER',$4,$5,'AVAILABLE',$6)`,
        [
          project.title,
          project.property_type,
          project.location,
          project.id,
          admin_id,
          null
        ]
      );
    }

    res.json({
      message: `Project ${status.toLowerCase()} successfully`,
      project: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Project review failed" });
  }
};