const bcrypt = require("bcrypt");
const db = require("../db");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role, wallet_balance) VALUES ($1, $2, $3, $4, $5)",
      [name, email, hashedPassword, role, 100000]
    );

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
};