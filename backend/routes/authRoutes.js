const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  signup,
  login,
  connectWallet,
  getMe,
  getAllUsers,
  removeUser
} = require("../controllers/authController");

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.patch("/auth/wallet", authMiddleware, connectWallet);
router.get("/auth/me", authMiddleware, getMe);

// Admin Routes
const requireAdmin = require("../middleware/requireAdmin");
router.get("/auth/users", authMiddleware, requireAdmin, getAllUsers);
router.delete("/auth/users/:id", authMiddleware, requireAdmin, removeUser);

module.exports = router;