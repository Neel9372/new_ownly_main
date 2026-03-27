const express = require("express");
const router = express.Router();
const { submitKYC, verifyKYC } = require("../controllers/kycController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/submit", authMiddleware, submitKYC);
router.patch("/verify/:id", authMiddleware, verifyKYC);

module.exports = router;