const express = require('express');
const router = express.Router();
const { deposit, withdraw, transfer, getHistory } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// All transaction routes are protected
router.use(protect);

router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/transfer', transfer);
router.get('/history', getHistory);

module.exports = router;
