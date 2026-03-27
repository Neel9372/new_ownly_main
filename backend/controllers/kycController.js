const db = require("../db");

// User submits KYC
exports.submitKYC = async (req, res) => {
  try {
    const { id_proof_type, id_proof_number } = req.body;
    const user_id = req.user.id; // comes from auth middleware

    const result = await db.query(
      `UPDATE users 
       SET id_proof_type = $1, id_proof_number = $2, kyc_status = 'SUBMITTED'
       WHERE id = $3
       RETURNING id, name, email, kyc_status, id_proof_type, id_proof_number`,
      [id_proof_type, id_proof_number, user_id]
    );

    res.json({
      message: "KYC submitted successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "KYC submission failed" });
  }
};

// Admin verifies KYC
exports.verifyKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED or REJECTED

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await db.query(
      `UPDATE users 
       SET kyc_status = $1
       WHERE id = $2
       RETURNING id, name, email, kyc_status`,
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