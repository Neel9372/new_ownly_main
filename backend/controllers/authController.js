const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const {
      fname, mname, lname, email, password, role,
      company_name, company_reg_id, license_url  // ← ADD THESE
    } = req.body;

    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const builder_status = role === "BUILDER" ? "PENDING" : "NOT_APPLICABLE";

    const result = await db.query(
      `INSERT INTO users (fname, mname, lname, email, password, role, company_name, company_reg_id, builder_status, license_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, fname, lname, email, role, builder_status, kyc_status, wallet_status`,
      [fname, mname || null, lname, email, hashedPassword, role || "INVESTOR",
        company_name || null, company_reg_id || null, builder_status, role === "BUILDER" ? license_url || null : null]  // ← ADD THESE
    );

    res.json({ message: "Account created successfully", user: result.rows[0] });

  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Signup failed" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await db.query(
      `SELECT * FROM users WHERE email = $1`, [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Check builder approval status
    if (user.role === "BUILDER") {
      if (user.builder_status === "PENDING") {
        return res.status(403).json({ error: "Your account is pending verification. Please wait for admin approval." });
      }
      if (user.builder_status === "REJECTED") {
        return res.status(403).json({ error: "Your registration request was rejected by the admin." });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role,
        wallet_status: user.wallet_status,
        kyc_status: user.kyc_status,
        kyc_rejection_reason: user.kyc_rejection_reason,
        builder_status: user.builder_status,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};

// CONNECT WALLET
exports.connectWallet = async (req, res) => {
  try {
    const { wallet_address } = req.body;
    const user_id = req.user.id;

    if (!wallet_address) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    const result = await db.query(
      `UPDATE users 
       SET wallet_address = $1, wallet_status = 'CONNECTED'
       WHERE id = $2
       RETURNING id, fname, email, wallet_address, wallet_status`,
      [wallet_address, user_id]
    );

    res.json({
      message: "Wallet connected successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Wallet already linked to another account" });
    }
    res.status(500).json({ error: "Wallet connection failed" });
  }
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, fname, mname, lname, email, role, 
              wallet_address, wallet_status, kyc_status, kyc_rejection_reason, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

// GET ALL USERS (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, fname, lname, email, role, kyc_status, wallet_status, wallet_address, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch all users" });
  }
};

// REMOVE USER (Admin)
exports.removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM users WHERE id = $1`, [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};