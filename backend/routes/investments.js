const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  investInProperty,
  getMyPortfolio,
  getMyTransactions,
  getPropertyInvestments,
} = require("../controllers/investmentController");

router.post("/invest", authMiddleware, investInProperty);
router.get("/portfolio", authMiddleware, getMyPortfolio);
router.get("/transactions", authMiddleware, getMyTransactions);
router.get("/property/:property_id", authMiddleware, getPropertyInvestments);

module.exports = router;