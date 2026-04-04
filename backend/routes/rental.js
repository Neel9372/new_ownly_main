const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');   // ← add this line
const { distributeRental, getRentalHistory, getMyRentalIncome } = require('../controllers/rentalController');

router.post('/distribute', authMiddleware, requireAdmin, distributeRental);  // ← add requireAdmin
router.get('/history/:property_id', authMiddleware, getRentalHistory);
router.get('/my-income', authMiddleware, getMyRentalIncome);

module.exports = router;