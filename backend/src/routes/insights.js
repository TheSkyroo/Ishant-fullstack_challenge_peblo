const express = require('express');
const { protect } = require('../middleware/auth');
const { getInsights } = require('../controllers/insightsController');

const router = express.Router();

router.get('/', protect, getInsights);

module.exports = router;
