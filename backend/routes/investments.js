const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  investInProperty,
  getMyPortfolio,
  getMyTransactions,
  getPropertyInvestments,
  getAllInvestments,
} = require("../controllers/investmentController");

const requireAdmin = require("../middleware/requireAdmin");

router.post("/invest", authMiddleware, investInProperty);
router.get("/portfolio", authMiddleware, getMyPortfolio);
router.get("/transactions", authMiddleware, getMyTransactions);

// Admin Routes
router.get("/all", authMiddleware, requireAdmin, getAllInvestments);
router.get("/property/:property_id", authMiddleware, requireAdmin, getPropertyInvestments);

module.exports = router;