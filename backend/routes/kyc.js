const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');   // ← add this line
const { submitKYC, getKYCStatus, getPendingKYC, verifyKYC } = require('../controllers/kycController');

router.post('/submit', authMiddleware, submitKYC);
router.get('/status', authMiddleware, getKYCStatus);
router.get('/pending', authMiddleware, requireAdmin, getPendingKYC);       // ← add requireAdmin
router.patch('/verify/:id', authMiddleware, requireAdmin, verifyKYC);      // ← add requireAdmin

module.exports = router;