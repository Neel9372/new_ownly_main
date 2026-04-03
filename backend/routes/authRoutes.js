const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  signup,
  login,
  connectWallet,
  getMe
} = require("../controllers/authController");

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.patch("/auth/wallet", authMiddleware, connectWallet);
router.get("/auth/me", authMiddleware, getMe);

module.exports = router;