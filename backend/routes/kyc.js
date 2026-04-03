const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  submitKYC,
  getKYCStatus,
  getPendingKYC,
  verifyKYC
} = require("../controllers/kycController");

router.post("/submit", authMiddleware, submitKYC);
router.get("/status", authMiddleware, getKYCStatus);
router.get("/pending", authMiddleware, getPendingKYC);
router.patch("/verify/:id", authMiddleware, verifyKYC);

module.exports = router;