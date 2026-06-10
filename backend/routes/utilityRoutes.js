const express = require('express');
const router = express.Router();
const { getLatestReading, logUtilityReading } = require('../controllers/utilityController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);
router.use(restrictTo('Caretaker', 'Admin'));

router.get('/latest-reading/:unit_id/:utility_type', getLatestReading);
router.post('/log', logUtilityReading);

module.exports = router;