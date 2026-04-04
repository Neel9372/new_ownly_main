const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  distributeRental,
  getRentalHistory,
  getMyRentalIncome,
} = require("../controllers/rentalController");

// Admin distributes rental
router.post("/distribute", authMiddleware, distributeRental);

// Get rental history for a property
router.get("/history/:property_id", authMiddleware, getRentalHistory);

// Investor sees their rental income
router.get("/my-income", authMiddleware, getMyRentalIncome);

module.exports = router;
