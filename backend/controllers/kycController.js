const db = require("../db");

// User submits KYC
exports.submitKYC = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id_proof_type, id_proof_number, id_proof_image, selfie_image } = req.body;

    if (!id_proof_type || !id_proof_number || !id_proof_image || !selfie_image) {
      return res.status(400).json({ error: "All KYC fields are required" });
    }

    // Check wallet is connected first
    const userCheck = await db.query(
      `SELECT wallet_status FROM users WHERE id = $1`, [user_id]
    );

    if (userCheck.rows[0].wallet_status !== "CONNECTED") {
      return res.status(400).json({ error: "Please connect your wallet before KYC" });
    }

    const result = await db.query(
      `UPDATE users 
       SET id_proof_type = $1, id_proof_number = $2,
           id_proof_image = $3, selfie_image = $4,
           kyc_status = 'SUBMITTED'
       WHERE id = $5
       RETURNING id, fname, email, kyc_status`,
      [id_proof_type, id_proof_number, id_proof_image, selfie_image, user_id]
    );

    res.json({
      message: "KYC submitted successfully. Awaiting admin verification.",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "KYC submission failed" });
  }
};

// Get KYC status
exports.getKYCStatus = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, fname, email, kyc_status, id_proof_type 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({ kyc: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch KYC status" });
  }
};

// Admin - get all pending KYC
exports.getPendingKYC = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, fname, lname, email, kyc_status, 
              id_proof_type, id_proof_number, 
              id_proof_image, selfie_image, created_at
       FROM users 
       WHERE kyc_status = 'SUBMITTED'
       ORDER BY created_at ASC`
    );

    res.json({ pending_kyc: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending KYC" });
  }
};

// Admin - verify or reject KYC
exports.verifyKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status must be VERIFIED or REJECTED" });
    }

    const result = await db.query(
      `UPDATE users SET kyc_status = $1
       WHERE id = $2
       RETURNING id, fname, email, kyc_status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: `KYC ${status.toLowerCase()} successfully`,
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "KYC verification failed" });
  }
};